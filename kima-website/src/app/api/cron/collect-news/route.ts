/**
 * /api/cron/collect-news
 * 뉴스 자동 수집 크론 엔드포인트
 *
 * 호출: Cloudflare Workers Cron → src/workers/cron.ts
 * 인증: Authorization: Bearer <CRON_SECRET_TOKEN>
 * 실행: 매일 UTC 23:00 (KST 08:00)
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchRSSFeed, fetchNaverNews, deduplicateArticles } from '@/lib/newsCollector'
import { processBatch } from '@/lib/aiSummarizer'
import type { RawArticle } from '@/lib/newsCollector'
import type { NewsCategory } from '@prisma/client'

// ─── 인증 ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.CRON_SECRET_TOKEN ?? process.env.CRON_SECRET ?? ''
  if (!token) return false                              // 환경변수 미설정 시 항상 거부
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  return bearer === token
}

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface RunResult {
  collected: number
  processed: number
  saved:     number
  skipped:   number
  sources:   { name: string; count: number; error?: string }[]
  durationMs: number
}

// ─── 메인 핸들러 ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const startAt = Date.now()

  // ① NewsSettings 조회
  let settings = await prisma.newsSettings.findUnique({ where: { id: 1 } })

  if (!settings) {
    // 최초 실행 시 기본값으로 생성
    settings = await prisma.newsSettings.upsert({
      where:  { id: 1 },
      create: { id: 1 },
      update: {},
    })
  }

  if (!settings.isEnabled) {
    return NextResponse.json({ message: '뉴스 자동 수집이 비활성화되어 있습니다.' })
  }

  // lastRunStatus 를 'running' 으로 먼저 업데이트
  await prisma.newsSettings.update({
    where:  { id: 1 },
    data:   { lastRunStatus: 'running', lastRunAt: new Date() },
  })

  const result: RunResult = {
    collected: 0,
    processed: 0,
    saved:     0,
    skipped:   0,
    sources:   [],
    durationMs: 0,
  }

  try {
    // ② 활성화된 소스 목록 조회
    const sources = await prisma.newsSource.findMany({
      where:   { isEnabled: true },
      orderBy: { order: 'asc' },
    })

    if (sources.length === 0) {
      await updateSettings(1, 'success', 0)
      return NextResponse.json({ message: '활성화된 뉴스 소스가 없습니다.', ...result })
    }

    // ③ 최근 30일 이내 이미 저장된 URL 목록 (중복 확인용)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const existingUrls = new Set(
      (
        await prisma.news.findMany({
          select:  { sourceUrl: true },
          where:   { publishedAt: { gte: cutoff } },
        })
      ).map((n) => n.sourceUrl),
    )

    // ④ 각 소스에서 기사 수집
    const allRaw: RawArticle[] = []

    for (const src of sources) {
      const keywords = src.keywords as string[]

      try {
        let articles: RawArticle[] = []

        if (src.apiType === 'naver') {
          const query = keywords.length ? keywords.join(' ') : '이주민 다문화'
          articles = await fetchNaverNews(
            query,
            src.name,
            Math.min(settings.maxArticlesPerRun, 50),
            keywords,
          )
        } else if (src.rssUrl) {
          articles = await fetchRSSFeed(
            src.rssUrl,
            src.name,
            keywords,
            settings.maxArticlesPerRun,
          )
        }

        result.sources.push({ name: src.name, count: articles.length })
        allRaw.push(...articles)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        result.sources.push({ name: src.name, count: 0, error: msg })
        console.error(`[collect-news] 소스 오류 (${src.name}):`, msg)
      }
    }

    // ⑤ URL 중복 제거 (소스 간 + DB 기존 URL)
    const deduped = deduplicateArticles(allRaw).filter(
      (a) => !existingUrls.has(a.url),
    )

    result.collected = deduped.length
    result.skipped   = allRaw.length - deduped.length

    if (deduped.length === 0) {
      await updateSettings(1, 'success', 0)
      result.durationMs = Date.now() - startAt
      return NextResponse.json({ message: '새로운 기사가 없습니다.', ...result })
    }

    // ⑥ AI 처리 (관련도 점수 + 요약 + 카테고리 + 키워드)
    const processed = await processBatch(deduped)
    result.processed = processed.length

    // ⑦ DB 저장
    if (processed.length > 0) {
      const rows = processed.map((art) => ({
        title:          art.title,
        summary:        art.summary,
        rawContent:     null,
        sourceUrl:      art.url,
        sourceName:     art.sourceName,
        category:       art.category as NewsCategory,
        publishedAt:    art.publishedAt,
        isVisible:      true,
        relevanceScore: art.relevanceScore / 100,   // 0-100 → 0.0-1.0
        keywords:       art.keywords,
      }))

      const created = await prisma.news.createMany({
        data:          rows,
        skipDuplicates: true,
      })

      result.saved = created.count
    }

    // ⑧ 설정 업데이트
    result.durationMs = Date.now() - startAt
    await updateSettings(1, 'success', result.saved)

    return NextResponse.json({
      message: `${result.saved}건 저장 완료`,
      ...result,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[collect-news] 실행 오류:', msg)

    await updateSettings(1, 'failed', 0).catch(() => null)

    result.durationMs = Date.now() - startAt
    return NextResponse.json(
      { error: msg, ...result },
      { status: 500 },
    )
  }
}

// ─── 설정 업데이트 헬퍼 ───────────────────────────────────────────────────────

async function updateSettings(
  id: number,
  status: 'success' | 'failed',
  count: number,
) {
  await prisma.newsSettings.update({
    where: { id },
    data:  {
      lastRunAt:     new Date(),
      lastRunStatus: status,
      lastRunCount:  count,
    },
  })
}
