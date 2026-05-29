/**
 * GET /api/cron/collect-news
 * 이주민·다문화 뉴스 자동 수집 크론 엔드포인트
 *
 * 호출: Cloudflare Workers Cron (src/workers/cron.ts)
 * 인증: Authorization: Bearer <CRON_SECRET_TOKEN>
 * 실행: 매일 UTC 23:00 (KST 08:00)
 *
 * ※ Cloudflare Pages 배포 시 nodejs_compat 플래그 필요
 */
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchRSSFeed, fetchNaverNews, deduplicateArticles } from '@/lib/newsCollector'
import { processBatch } from '@/lib/aiSummarizer'
import type { RawArticle } from '@/lib/newsCollector'
import type { NewsCategory } from '@prisma/client'

export async function GET(request: NextRequest) {
  // ── 인증 ──────────────────────────────────────────────────────────────────
  const authHeader    = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET_TOKEN}`
  if (!process.env.CRON_SECRET_TOKEN || authHeader !== expectedToken) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const startAt = Date.now()

  try {
    // a) NewsSettings 조회
    const settings = await prisma.newsSettings.findUnique({ where: { id: 1 } })

    // b) 비활성 상태면 조기 종료
    if (!settings?.isEnabled) {
      return NextResponse.json({ message: '자동 수집이 비활성화 상태입니다.' })
    }

    // c) 활성화된 소스 목록 조회
    const sources = await prisma.newsSource.findMany({
      where:   { isEnabled: true },
      orderBy: { order: 'asc' },
    })

    if (sources.length === 0) {
      return NextResponse.json({ message: '활성화된 뉴스 소스가 없습니다.', collected: 0, processed: 0 })
    }

    // d) 최근 7일 이내 저장된 URL 목록 (중복 방지)
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const existingUrls = new Set(
      (
        await prisma.news.findMany({
          select: { sourceUrl: true },
          where:  { publishedAt: { gte: cutoff } },
        })
      ).map((n) => n.sourceUrl),
    )

    // e) 각 소스에서 뉴스 수집
    const allRaw: RawArticle[] = []
    const maxPerSource = settings?.maxArticlesPerRun ?? 50

    for (const src of sources) {
      const keywords = src.keywords as string[]
      try {
        if (src.apiType === 'naver') {
          const query = keywords.length ? keywords.join(' ') : '이주민 다문화'
          const articles = await fetchNaverNews(query, src.name, Math.min(maxPerSource, 50), keywords)
          allRaw.push(...articles)
        } else if (src.rssUrl) {
          const articles = await fetchRSSFeed(src.rssUrl, src.name, keywords, maxPerSource)
          allRaw.push(...articles)
        }
      } catch (err) {
        console.error(`[collect-news] 소스 오류 (${src.name}):`, err)
      }
    }

    // f) 중복 제거 — 소스 간 + 최근 7일 DB URL
    const newArticles = deduplicateArticles(allRaw).filter(
      (a) => !existingUrls.has(a.url),
    )

    const collected = newArticles.length

    if (collected === 0) {
      await updateSettings(1, 'success', 0)
      return NextResponse.json({ message: '새로운 기사가 없습니다.', collected: 0, processed: 0 })
    }

    // g) AI 처리
    const processed = await processBatch(newArticles)

    // h) DB 저장
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
          relevanceScore: art.relevanceScore / 100,  // 0-100 → 0.0-1.0
          keywords:       art.keywords,
        })),
        skipDuplicates: true,
      })
      saved = result.count
    }

    // i) NewsSettings 업데이트
    await updateSettings(1, 'success', saved)

    return NextResponse.json({
      collected,
      processed: processed.length,
      saved,
      durationMs: Date.now() - startAt,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[collect-news] 실행 오류:', msg)
    await updateSettings(1, 'failed', 0).catch(() => null)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function updateSettings(id: number, status: 'success' | 'failed', count: number) {
  await prisma.newsSettings.update({
    where: { id },
    data:  { lastRunAt: new Date(), lastRunStatus: status, lastRunCount: count },
  })
}
