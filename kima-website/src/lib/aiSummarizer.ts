/**
 * Google Gemini based news analyzer.
 * Falls back to deterministic keyword/source classification when Gemini is not
 * configured, quota-limited, or temporarily unavailable.
 */

import type { RawArticle } from './newsCollector'
import { cfEnv } from './cfEnv'
import {
  DEFAULT_NEWS_CATEGORIES,
  inferNewsCategory,
  parseNewsCategory,
  type NewsCategoryConfig,
} from './newsCategoryConfig'

export type NewsCategory = string

export interface ProcessedArticle {
  title: string
  summary: string
  url: string
  sourceName: string
  publishedAt: Date
  category: NewsCategory
  relevanceScore: number
  keywords: string[]
}

interface AIResponse {
  relevance: number
  summary: string
  category: string
  keywords: string[]
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
    finishReason?: string
  }>
  error?: { code: number; message: string; status: string }
}

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash-lite'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const RELEVANCE_MIN = 50
const TIMEOUT_MS = 30_000
const FALLBACK_RETRY_MS = 60_000
const BATCH_DELAY_MS = 4_000
const STRONG_RELEVANCE_TERMS = [
  '다문화',
  '다문화가족',
  '다문화 자녀',
  '결혼이민',
  '외국인근로',
  '외국인 근로',
  '이주노동',
  '고용허가',
  '유학생',
  '외국인학생',
  '난민',
  '체류',
  '비자',
  '출입국',
  '외국인주민',
  '외국인 주민',
  '이민자',
  '사회통합',
  '한국어교육',
  'multicultural',
  'migrant worker',
  'foreign worker',
  'immigrant',
  'migration',
]
const BROAD_RELEVANCE_TERMS = ['이주민', '외국인', 'migrant', 'foreigner']

let geminiFallbackUntil = 0

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(Number(n) || 0, min), max)
}

function getGeminiModel(): string {
  return cfEnv('GEMINI_MODEL') ?? DEFAULT_GEMINI_MODEL
}

function shouldAttemptGemini(): boolean {
  return !!cfEnv('GEMINI_API_KEY') && Date.now() >= geminiFallbackUntil
}

function enableFallbackTemporarily() {
  geminiFallbackUntil = Date.now() + FALLBACK_RETRY_MS
}

function estimateFallbackRelevance(article: RawArticle): number {
  const haystack = [
    article.title,
    article.summary,
    article.sourceName,
    article.keywords.join(' '),
  ].join(' ').toLowerCase()

  const strongHits = STRONG_RELEVANCE_TERMS.filter((term) =>
    haystack.includes(term.toLowerCase()),
  ).length

  if (strongHits > 0) {
    const sourceBoost = article.defaultCategory && article.defaultCategory !== 'OTHER' ? 8 : 0
    return clamp(62 + strongHits * 6 + sourceBoost, RELEVANCE_MIN, 86)
  }

  const broadHits = BROAD_RELEVANCE_TERMS.filter((term) =>
    haystack.includes(term.toLowerCase()),
  ).length

  if (article.defaultCategory && article.defaultCategory !== 'OTHER' && broadHits > 0) {
    return RELEVANCE_MIN
  }

  return 0
}

function fallbackArticle(
  article: RawArticle,
  categories: NewsCategoryConfig[] = DEFAULT_NEWS_CATEGORIES,
): ProcessedArticle | null {
  const relevanceScore = estimateFallbackRelevance(article)
  if (relevanceScore < RELEVANCE_MIN) return null

  return {
    title: article.title,
    summary: (article.summary || article.title).slice(0, 500).trim(),
    url: article.url,
    sourceName: article.sourceName,
    publishedAt: article.publishedAt,
    category: inferNewsCategory(article, categories, article.defaultCategory ?? 'OTHER'),
    relevanceScore,
    keywords: article.keywords.slice(0, 5),
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms: number,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildPrompt(article: RawArticle, categories: NewsCategoryConfig[]): string {
  const content = [article.title, article.summary].filter(Boolean).join('\n\n')
  const categoryList = categories
    .filter((category) => category.isEnabled)
    .map((category) => `${category.label}(${category.key})`)
    .join(' | ')

  return `다음 뉴스 기사를 분석하십시오.

제목: ${article.title}
출처: ${article.sourceName}
내용: ${content.slice(0, 1200)}

아래 JSON 형식으로만 응답하십시오. 다른 텍스트는 포함하지 마십시오.
{
  "relevance": <이주민·외국인·다문화 관련성 점수 0-100. 직접 관련 없으면 낮게>,
  "summary": "<3-4문장 한국어 요약. KIMA 회원에게 중요한 내용 중심>",
  "category": "<다음 중 하나: ${categoryList}>",
  "keywords": ["<키워드>", "<키워드>", "<키워드>"]
}

판단 기준:
- 90-100: 이주민·외국인·다문화 정책의 핵심 주제
- 70-89: 이주민·다문화 내용이 기사의 주요 부분
- 50-69: 이주민·다문화 내용이 일부 포함
- 50 미만: 관련성 낮음`
}

export async function processArticleWithAI(
  article: RawArticle,
  categories: NewsCategoryConfig[] = DEFAULT_NEWS_CATEGORIES,
): Promise<ProcessedArticle | null> {
  const apiKey = cfEnv('GEMINI_API_KEY') ?? ''
  if (!apiKey) {
    console.warn('[aiSummarizer] GEMINI_API_KEY is not configured')
    return fallbackArticle(article, categories)
  }

  if (!shouldAttemptGemini()) {
    return fallbackArticle(article, categories)
  }

  const url = `${GEMINI_API_BASE}/${getGeminiModel()}:generateContent?key=${apiKey}`

  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(article, categories) }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        }),
        cache: 'no-store',
      },
      TIMEOUT_MS,
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[aiSummarizer] Gemini ${res.status}: ${body.slice(0, 200)}`)
      if ([403, 404, 429].includes(res.status)) enableFallbackTemporarily()
      return fallbackArticle(article, categories)
    }

    const data = (await res.json()) as GeminiResponse

    if (data.error) {
      console.error('[aiSummarizer] Gemini error:', data.error.message)
      if ([403, 404, 429].includes(data.error.code)) enableFallbackTemporarily()
      return fallbackArticle(article, categories)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text) {
      console.warn('[aiSummarizer] Empty Gemini response:', article.url)
      return fallbackArticle(article, categories)
    }

    const parsed = JSON.parse(text) as Partial<AIResponse>
    const relevance = clamp(parsed.relevance ?? 0, 0, 100)
    if (relevance < RELEVANCE_MIN) return null

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.slice(0, 5).map(String)
      : article.keywords.slice(0, 5)

    return {
      title: article.title,
      summary: (parsed.summary ?? article.summary ?? '').trim(),
      url: article.url,
      sourceName: article.sourceName,
      publishedAt: article.publishedAt,
      category: parseNewsCategory(parsed.category ?? '', categories),
      relevanceScore: relevance,
      keywords,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('abort') || msg.toLowerCase().includes('timeout')) {
      console.error('[aiSummarizer] Gemini timeout:', article.url)
    } else if (msg.includes('JSON')) {
      console.error('[aiSummarizer] JSON parse error:', article.url, msg)
    } else {
      console.error('[aiSummarizer] Error:', article.url, msg)
    }
    enableFallbackTemporarily()
    return fallbackArticle(article, categories)
  }
}

export async function processBatch(
  articles: RawArticle[],
  onProgress?: (
    current: number,
    total: number,
    result: ProcessedArticle | null,
  ) => void,
  categories: NewsCategoryConfig[] = DEFAULT_NEWS_CATEGORIES,
): Promise<ProcessedArticle[]> {
  const results: ProcessedArticle[] = []

  for (let i = 0; i < articles.length; i++) {
    const result = await processArticleWithAI(articles[i], categories)
    if (result) results.push(result)
    onProgress?.(i + 1, articles.length, result)
    if (i < articles.length - 1 && shouldAttemptGemini()) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  return results
}
