/**
 * 뉴스 수집 공유 로직
 * collect-news (cron) / collect-now (admin) 양쪽에서 직접 호출
 */
import { prisma } from '@/lib/prisma'
import { fetchRSSFeed, fetchNaverNews, deduplicateArticles } from '@/lib/newsCollector'
import { processBatch } from '@/lib/aiSummarizer'
import type { RawArticle } from '@/lib/newsCollector'
import { cfEnv } from '@/lib/cfEnv'
import { getNewsCategories } from '@/lib/newsCategories'

export interface CollectResult {
  message?: string
  collected: number
  processed: number
  saved: number
  totalFetched: number
  sourceStats: { name: string; type: string; fetched: number; error?: string }[]
  envStatus: { GEMINI_API_KEY: boolean; NAVER_NEWS_CLIENT_ID: boolean; NAVER_NEWS_CLIENT_SECRET: boolean }
  durationMs: number
}

export async function runNewsCollection(): Promise<CollectResult> {
  const startAt = Date.now()

  const envStatus = {
    GEMINI_API_KEY:          !!cfEnv('GEMINI_API_KEY'),
    NAVER_NEWS_CLIENT_ID:    !!cfEnv('NAVER_NEWS_CLIENT_ID'),
    NAVER_NEWS_CLIENT_SECRET:!!cfEnv('NAVER_NEWS_CLIENT_SECRET'),
  }

  const empty: CollectResult = {
    collected: 0, processed: 0, saved: 0, totalFetched: 0,
    sourceStats: [], envStatus, durationMs: 0,
  }

  const settings = await prisma.newsSettings.findUnique({ where: { id: 1 } })

  if (!settings?.isEnabled) {
    return { ...empty, message: '자동 수집이 비활성화 상태입니다.', durationMs: Date.now() - startAt }
  }

  const [sources, categories] = await Promise.all([
    prisma.newsSource.findMany({
      where:   { isEnabled: true },
      orderBy: { order: 'asc' },
    }),
    getNewsCategories(),
  ])

  if (sources.length === 0) {
    return { ...empty, message: '활성화된 뉴스 소스가 없습니다.', durationMs: Date.now() - startAt }
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const existingUrls = new Set(
    (await prisma.news.findMany({
      select: { sourceUrl: true },
      where:  { publishedAt: { gte: cutoff } },
    })).map((n) => n.sourceUrl),
  )

  const allRaw: RawArticle[] = []
  const maxArticlesPerRun = Math.max(1, settings?.maxArticlesPerRun ?? 50)
  const maxPerSource = Math.min(maxArticlesPerRun, 50)
  const sourceStats: CollectResult['sourceStats'] = []

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
        articles = await fetchRSSFeed(src.rssUrl, src.name, keywords, maxPerSource)
      }

      const taggedArticles = articles.map((article) => ({
        ...article,
        defaultCategory: src.defaultCategory,
      }))

      sourceStats.push({ name: src.name, type: src.apiType, fetched: taggedArticles.length })
      allRaw.push(...taggedArticles)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      sourceStats.push({ name: src.name, type: src.apiType, fetched: 0, error: msg })
      console.error(`[collect-news] 소스 오류 (${src.name}):`, msg)
    }
  }

  const newArticles = deduplicateArticles(allRaw)
    .filter((a) => !existingUrls.has(a.url))
    .slice(0, maxArticlesPerRun)
  const collected = newArticles.length

  if (collected === 0) {
    await updateSettings(1, 'success', 0)
    return {
      message: '새로운 기사가 없습니다.',
      collected: 0, processed: 0, saved: 0,
      totalFetched: allRaw.length,
      sourceStats, envStatus,
      durationMs: Date.now() - startAt,
    }
  }

  const processed = await processBatch(newArticles, undefined, categories)

  let saved = 0
  if (processed.length > 0) {
    const result = await prisma.news.createMany({
      data: processed.map((art) => ({
        title:          art.title,
        summary:        art.summary,
        rawContent:     null,
        sourceUrl:      art.url,
        sourceName:     art.sourceName,
        category:       art.category,
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

  return {
    collected, processed: processed.length, saved,
    totalFetched: allRaw.length,
    sourceStats, envStatus,
    durationMs: Date.now() - startAt,
  }
}

async function updateSettings(id: number, status: 'success' | 'failed', count: number) {
  await prisma.newsSettings.update({
    where: { id },
    data:  { lastRunAt: new Date(), lastRunStatus: status, lastRunCount: count },
  })
}
