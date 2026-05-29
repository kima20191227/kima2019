/**
 * GET /api/cron/collect-news
 * 이주민·다문화 뉴스 자동 수집 크론 엔드포인트
 *
 * ※ Prisma(pg) 의존성으로 Node.js 런타임 필요 — edge 선언 제거
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchRSSFeed, fetchNaverNews, deduplicateArticles } from '@/lib/newsCollector'
import { processBatch } from '@/lib/aiSummarizer'
import type { RawArticle } from '@/lib/newsCollector'
import type { NewsCategory } from '@prisma/client'

export async function GET(request: NextRequest) {
  // ── 인증 ──────────────────────────────────────────────────────────────────
  const token = process.env.CRON_SECRET_TOKEN ?? process.env.CRON_SECRET ?? ''
  const authHeader = request.headers.get('authorization')
  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const startAt = Date.now()

  // 환경변수 설정 상태 확인
  const envStatus = {
    GEMINI_API_KEY:          !!process.env.GEMINI_API_KEY,
    NAVER_NEWS_CLIENT_ID:    !!process.env.NAVER_NEWS_CLIENT_ID,
    NAVER_NEWS_CLIENT_SECRET:!!process.env.NAVER_NEWS_CLIENT_SECRET,
  }

  try {
    const settings = await prisma.newsSettings.findUnique({ where: { id: 1 } })

    if (!settings?.isEnabled) {
      return NextResponse.json({ message: '자동 수집이 비활성화 상태입니다.', envStatus })
    }

    const sources = await prisma.newsSource.findMany({
      where:   { isEnabled: true },
      orderBy: { order: 'asc' },
    })

    if (sources.length === 0) {
      return NextResponse.json({ message: '활성화된 뉴스 소스가 없습니다.', collected: 0, envStatus })
    }

    // 최근 7일 이내 저장된 URL (중복 방지)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const existingUrls = new Set(
      (await prisma.news.findMany({
        select: { sourceUrl: true },
        where:  { publishedAt: { gte: cutoff } },
      })).map((n) => n.sourceUrl),
    )

    // 각 소스에서 수집 + 소스별 통계 기록
    const allRaw: RawArticle[] = []
    const maxPerSource = settings?.maxArticlesPerRun ?? 50
    const sourceStats: { name: string; type: string; fetched: number; error?: string }[] = []

    for (const src of sources) {
      const keywords = src.keywords as string[]
      try {
        let articles: RawArticle[] = []

        if (src.apiType === 'naver') {
          if (!envStatus.NAVER_NEWS_CLIENT_ID || !envStatus.NAVER_NEWS_CLIENT_SECRET) {
            sourceStats.push({ name: src.name, type: 'naver', fetched: 0, error: 'NAVER 환경변수 미설정' })
            continue
          }
          const query = keywords.length ? keywords.join(' ') : '이주민 다문화'
          articles = await fetchNaverNews(query, src.name, Math.min(maxPerSource, 50), keywords)
        } else if (src.rssUrl) {
          // RSS: 키워드 없으면 전체 수집 (첫 번째 실행 시 유입 극대화)
          articles = await fetchRSSFeed(src.rssUrl, src.name, keywords, maxPerSource)
        }

        sourceStats.push({ name: src.name, type: src.apiType, fetched: articles.length })
        allRaw.push(...articles)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        sourceStats.push({ name: src.name, type: src.apiType, fetched: 0, error: msg })
        console.error(`[collect-news] 소스 오류 (${src.name}):`, msg)
      }
    }

    const newArticles = deduplicateArticles(allRaw).filter(
      (a) => !existingUrls.has(a.url),
    )
    const collected = newArticles.length

    if (collected === 0) {
      await updateSettings(1, 'success', 0)
      return NextResponse.json({
        message: '새로운 기사가 없습니다.',
        collected: 0,
        processed: 0,
        totalFetched: allRaw.length,
        sourceStats,
        envStatus,
        durationMs: Date.now() - startAt,
      })
    }

    // AI 처리 (Gemini)
    const processed = await processBatch(newArticles)

    let saved = 0
    if (processed.length > 0) {
      const result = await prisma.news.createMany({
        data: processed.map((art) => ({
          title:          art.title,
          summary:        art.summary,
          rawContent:     null,
          sourceUrl:      art.url,
          sourceName:     art.sourceName,
          category:       art.category as NewsCategory,
          publishedAt:    art.publishedAt,
          isVisible:      true,
          relevanceScore: art.relevanceScore / 100,
          keywords:       art.keywords,
        })),
        skipDuplicates: true,
      })
      saved = result.count
    }

    await updateSettings(1, 'success', saved)

    return NextResponse.json({
      collected,
      processed: processed.length,
      saved,
      totalFetched: allRaw.length,
      sourceStats,
      envStatus,
      durationMs: Date.now() - startAt,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[collect-news] 실행 오류:', msg)
    await updateSettings(1, 'failed', 0).catch(() => null)
    return NextResponse.json({ error: msg, envStatus }, { status: 500 })
  }
}

async function updateSettings(id: number, status: 'success' | 'failed', count: number) {
  await prisma.newsSettings.update({
    where: { id },
    data:  { lastRunAt: new Date(), lastRunStatus: status, lastRunCount: count },
  })
}
