import { prisma } from '@/lib/prisma'
import { fetchRSSFeed, fetchNaverNews, deduplicateArticles } from '@/lib/newsCollector'
import { processBatch, type ProcessedArticle } from '@/lib/aiSummarizer'
import type { RawArticle } from '@/lib/newsCollector'
import { cfEnv } from '@/lib/cfEnv'
import { getNewsCategories } from '@/lib/newsCategories'

const DEFAULT_NAVER_QUERY = '이주민 다문화'

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

async function fetchNaverSourceArticles(
  sourceName: string,
  keywords: string[],
  maxItems: number,
): Promise<RawArticle[]> {
  if (keywords.length === 0) {
    return fetchNaverNews(DEFAULT_NAVER_QUERY, sourceName, maxItems, [])
  }

  const perKeyword = Math.max(3, Math.ceil(maxItems / keywords.length))
  const batches = await Promise.all(
    keywords.map((keyword) => {
      const filterTerms = keyword.split(/\s+/).filter(Boolean)
      return fetchNaverNews(keyword, sourceName, perKeyword, filterTerms)
    }),
  )

  return deduplicateArticles(batches.flat()).slice(0, maxItems)
}

function normalizeArticleUrl(url: string): string {
  return url.replace(/[?#].*$/, '').trim().toLowerCase()
}

function normalizeArticleTitle(title: string): string {
  return title
    .normalize('NFKC')
    .replace(/<[^>]*>/g, '')
    .replace(/\.\.\./g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase()
}

function deduplicateProcessedArticles(articles: ProcessedArticle[]): ProcessedArticle[] {
  const seenUrls = new Set<string>()
  const seenTitles = new Set<string>()
  const sorted = [...articles].sort((a, b) => {
    if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore
    return b.publishedAt.getTime() - a.publishedAt.getTime()
  })
  const deduped: ProcessedArticle[] = []

  for (const article of sorted) {
    const urlKey = normalizeArticleUrl(article.url)
    const titleKey = normalizeArticleTitle(article.title)
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue

    seenUrls.add(urlKey)
    seenTitles.add(titleKey)
    deduped.push(article)
  }

  return deduped
}

export async function runNewsCollection(): Promise<CollectResult> {
  const startAt = Date.now()

  const envStatus = {
    GEMINI_API_KEY: !!cfEnv('GEMINI_API_KEY'),
    NAVER_NEWS_CLIENT_ID: !!cfEnv('NAVER_NEWS_CLIENT_ID'),
    NAVER_NEWS_CLIENT_SECRET: !!cfEnv('NAVER_NEWS_CLIENT_SECRET'),
  }

  const empty: CollectResult = {
    collected: 0,
    processed: 0,
    saved: 0,
    totalFetched: 0,
    sourceStats: [],
    envStatus,
    durationMs: 0,
  }

  const settings = await prisma.newsSettings.findUnique({ where: { id: 1 } })

  if (!settings?.isEnabled) {
    return { ...empty, message: '자동 수집이 비활성화되어 있습니다.', durationMs: Date.now() - startAt }
  }

  const [sources, categories] = await Promise.all([
    prisma.newsSource.findMany({
      where: { isEnabled: true },
      orderBy: { order: 'asc' },
    }),
    getNewsCategories(),
  ])

  if (sources.length === 0) {
    return { ...empty, message: '활성화된 뉴스 소스가 없습니다.', durationMs: Date.now() - startAt }
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentNews = await prisma.news.findMany({
    select: { sourceUrl: true, title: true },
    where: { publishedAt: { gte: cutoff } },
  })
  const existingUrls = new Set(recentNews.map((news) => normalizeArticleUrl(news.sourceUrl)))
  const existingTitles = new Set(recentNews.map((news) => normalizeArticleTitle(news.title)))

  const allRaw: RawArticle[] = []
  const maxArticlesPerRun = Math.max(1, settings.maxArticlesPerRun ?? 50)
  const maxPerSource = Math.min(maxArticlesPerRun, 50)
  const sourceStats: CollectResult['sourceStats'] = []

  for (const source of sources) {
    const keywords = source.keywords as string[]
    try {
      let articles: RawArticle[] = []

      if (source.apiType === 'naver') {
        if (!envStatus.NAVER_NEWS_CLIENT_ID || !envStatus.NAVER_NEWS_CLIENT_SECRET) {
          sourceStats.push({ name: source.name, type: 'naver', fetched: 0, error: 'NAVER 환경변수 미설정' })
          continue
        }
        articles = await fetchNaverSourceArticles(source.name, keywords, maxPerSource)
      } else if (source.rssUrl) {
        articles = await fetchRSSFeed(source.rssUrl, source.name, keywords, maxPerSource)
      }

      const taggedArticles = articles.map((article) => ({
        ...article,
        defaultCategory: source.defaultCategory,
      }))

      sourceStats.push({ name: source.name, type: source.apiType, fetched: taggedArticles.length })
      allRaw.push(...taggedArticles)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      sourceStats.push({ name: source.name, type: source.apiType, fetched: 0, error: msg })
      console.error(`[collect-news] source error (${source.name}):`, msg)
    }
  }

  const newArticles = deduplicateArticles(allRaw)
    .filter((article) => {
      const urlKey = normalizeArticleUrl(article.url)
      const titleKey = normalizeArticleTitle(article.title)
      return !existingUrls.has(urlKey) && !existingTitles.has(titleKey)
    })
    .slice(0, maxArticlesPerRun)
  const collected = newArticles.length

  if (collected === 0) {
    await updateSettings(1, 'success', 0)
    return {
      message: '새로운 기사가 없습니다.',
      collected: 0,
      processed: 0,
      saved: 0,
      totalFetched: allRaw.length,
      sourceStats,
      envStatus,
      durationMs: Date.now() - startAt,
    }
  }

  const processed = deduplicateProcessedArticles(
    await processBatch(newArticles, undefined, categories),
  )

  let saved = 0
  if (processed.length > 0) {
    const result = await prisma.news.createMany({
      data: processed.map((article) => ({
        title: article.title,
        summary: article.summary,
        rawContent: null,
        sourceUrl: article.url,
        sourceName: article.sourceName,
        category: article.category,
        publishedAt: article.publishedAt,
        isVisible: true,
        relevanceScore: article.relevanceScore / 100,
        keywords: article.keywords,
      })),
      skipDuplicates: true,
    })
    saved = result.count
  }

  await updateSettings(1, 'success', saved)

  return {
    collected,
    processed: processed.length,
    saved,
    totalFetched: allRaw.length,
    sourceStats,
    envStatus,
    durationMs: Date.now() - startAt,
  }
}

async function updateSettings(id: number, status: 'success' | 'failed', count: number) {
  await prisma.newsSettings.update({
    where: { id },
    data: { lastRunAt: new Date(), lastRunStatus: status, lastRunCount: count },
  })
}
