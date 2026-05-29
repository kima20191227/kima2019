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
import { estimateMissionRelevance, isMissionRelevantArticle } from './newsMissionRelevance'

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

function fallbackArticle(
  article: RawArticle,
  categories: NewsCategoryConfig[] = DEFAULT_NEWS_CATEGORIES,
): ProcessedArticle | null {
  const relevanceScore = estimateMissionRelevance(article)
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
- 90-100: 이주민·다문화가족·이주노동자·유학생·난민 사역이나 정책의 핵심 주제
- 70-89: KIMA 회원 단체가 사역, 상담, 교육, 복지, 법률 지원에 참고할 만한 주요 기사
- 50-69: 이주민 사역과 간접 관련은 있으나 현장 활용성은 제한적인 기사
- 50 미만: 스포츠, 연예, 주식, 일반 사건, 개인 범죄 등 선교·다문화사역과 직접 관련 없는 기사
- 외국인 선수 비자, 연예인/스포츠 기사, 주식시장의 외국인 투자자, 개인적 연애·범죄 사건은 낮게 평가`
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
    if (!isMissionRelevantArticle(article)) return null

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
