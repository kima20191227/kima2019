/**
 * aiSummarizer.ts  — Google Gemini 버전
 * Edge Runtime 전용 AI 기사 분석기
 * - @google/generative-ai 패키지 사용 금지, fetch API 직접 호출
 * - GEMINI_API_KEY 환경변수 사용
 * - Cloudflare Pages Edge Runtime / Next.js Edge Runtime 호환
 */

import type { RawArticle } from './newsCollector'
import { cfEnv } from './cfEnv'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export type NewsCategory =
  | 'LAW'            // 법령·정책
  | 'STATISTICS'     // 통계·연구
  | 'MULTICULTURAL'  // 다문화가족
  | 'MIGRANT_WORKER' // 이주노동자
  | 'STUDENT'        // 유학생
  | 'OTHER'          // 기타

export interface ProcessedArticle {
  title:          string
  summary:        string          // AI 생성 한국어 요약 (3-4문장)
  url:            string
  sourceName:     string
  publishedAt:    Date
  category:       NewsCategory
  relevanceScore: number          // 0-100
  keywords:       string[]        // 3-5개
}

/** AI 응답 JSON 구조 */
interface AIResponse {
  relevance:  number
  summary:    string
  category:   string
  keywords:   string[]
}

/** Gemini generateContent 응답 최소 타입 */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
    finishReason?: string
  }>
  error?: { code: number; message: string; status: string }
}

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash-lite'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const RELEVANCE_MIN   = 50
const TIMEOUT_MS      = 30_000
const FALLBACK_RETRY_MS = 60_000

let geminiFallbackUntil = 0
const BATCH_DELAY_MS  = 4_000   // Gemini 무료 티어: 분당 15회 제한 방지 (4초)

// 카테고리 한글 → enum 매핑
const CATEGORY_MAP: Record<string, NewsCategory> = {
  '법령':      'LAW',
  '정책':      'LAW',
  '통계':      'STATISTICS',
  '연구':      'STATISTICS',
  '다문화가족': 'MULTICULTURAL',
  '다문화':    'MULTICULTURAL',
  '이주노동자': 'MIGRANT_WORKER',
  '유학생':    'STUDENT',
  '기타':      'OTHER',
}

// ─── 내부 유틸리티 ────────────────────────────────────────────────────────────

function parseCategory(raw: string): NewsCategory {
  const trimmed = raw?.trim() ?? ''
  const enumValues: NewsCategory[] = [
    'LAW', 'STATISTICS', 'MULTICULTURAL', 'MIGRANT_WORKER', 'STUDENT', 'OTHER',
  ]
  if (enumValues.includes(trimmed as NewsCategory)) return trimmed as NewsCategory
  for (const [label, value] of Object.entries(CATEGORY_MAP)) {
    if (trimmed.includes(label)) return value
  }
  return 'OTHER'
}

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

function fallbackArticle(article: RawArticle): ProcessedArticle {
  return {
    title:          article.title,
    summary:        (article.summary || article.title).slice(0, 500).trim(),
    url:            article.url,
    sourceName:     article.sourceName,
    publishedAt:    article.publishedAt,
    category:       'OTHER',
    relevanceScore: RELEVANCE_MIN,
    keywords:       article.keywords.slice(0, 5),
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  ms: number,
): Promise<Response> {
  const ctrl  = new AbortController()
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

// ─── 프롬프트 ─────────────────────────────────────────────────────────────────

function buildPrompt(article: RawArticle): string {
  const content = [article.title, article.summary].filter(Boolean).join('\n\n')
  return `다음 뉴스 기사를 분석하십시오.

제목: ${article.title}
출처: ${article.sourceName}
내용: ${content.slice(0, 1200)}

아래 JSON 형식으로만 응답하십시오. 다른 텍스트는 포함하지 마십시오.
{
  "relevance": <이주민·외국인·다문화 관련성 점수 0-100. 직접 관련 없으면 낮게>,
  "summary": "<3-4문장 한국어 요약. 이주민·다문화 관점에서 핵심만>",
  "category": "<다음 중 하나: 법령 | 통계 | 다문화가족 | 이주노동자 | 유학생 | 기타>",
  "keywords": ["<키워드1>", "<키워드2>", "<키워드3>"]
}

판단 기준:
- 90-100: 이주민·외국인·다문화 정책이 기사의 핵심 주제
- 70-89: 이주민·다문화 내용이 기사의 주요 부분
- 50-69: 이주민·다문화 내용이 일부 포함
- 50 미만: 관련성 낮음 (이 경우에도 반드시 위 JSON 형식 유지)`
}

// ─── 공개 함수 ────────────────────────────────────────────────────────────────

/**
 * 기사 1건을 Gemini로 분석
 * - 관련성 50 미만이면 null 반환
 * - API 오류 / 타임아웃 시 null 반환
 */
export async function processArticleWithAI(
  article: RawArticle,
): Promise<ProcessedArticle | null> {
  const apiKey = cfEnv('GEMINI_API_KEY') ?? ''
  if (!apiKey) {
    console.warn('[aiSummarizer] GEMINI_API_KEY 환경변수 미설정')
    return fallbackArticle(article)
  }

  if (!shouldAttemptGemini()) {
    return fallbackArticle(article)
  }

  const url = `${GEMINI_API_BASE}/${getGeminiModel()}:generateContent?key=${apiKey}`

  try {
    const res = await fetchWithTimeout(
      url,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildPrompt(article) }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',  // JSON 모드
            temperature:      0.2,
            maxOutputTokens:  512,
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
      return fallbackArticle(article)
    }

    const data = (await res.json()) as GeminiResponse

    if (data.error) {
      console.error('[aiSummarizer] Gemini error:', data.error.message)
      if ([403, 404, 429].includes(data.error.code)) enableFallbackTemporarily()
      return fallbackArticle(article)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!text) {
      console.warn('[aiSummarizer] 빈 응답:', article.url)
      return fallbackArticle(article)
    }

    const parsed = JSON.parse(text) as Partial<AIResponse>

    const relevance = clamp(parsed.relevance ?? 0, 0, 100)
    if (relevance < RELEVANCE_MIN) return null

    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.slice(0, 5).map(String)
      : article.keywords.slice(0, 5)

    return {
      title:          article.title,
      summary:        (parsed.summary ?? article.summary ?? '').trim(),
      url:            article.url,
      sourceName:     article.sourceName,
      publishedAt:    article.publishedAt,
      category:       parseCategory(parsed.category ?? ''),
      relevanceScore: relevance,
      keywords,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('abort') || msg.toLowerCase().includes('timeout')) {
      console.error('[aiSummarizer] Gemini 타임아웃 (30s):', article.url)
    } else if (msg.includes('JSON')) {
      console.error('[aiSummarizer] JSON 파싱 오류:', article.url, msg)
    } else {
      console.error('[aiSummarizer] 오류:', article.url, msg)
    }
    enableFallbackTemporarily()
    return fallbackArticle(article)
  }
}

/**
 * 기사 배열을 순차적으로 AI 처리 (배치)
 * - 기사 간 4000ms 딜레이 (Gemini 무료: 분당 15회 제한 방지)
 * - null 결과는 제외하고 반환
 */
export async function processBatch(
  articles: RawArticle[],
  onProgress?: (
    current: number,
    total:   number,
    result:  ProcessedArticle | null,
  ) => void,
): Promise<ProcessedArticle[]> {
  const results: ProcessedArticle[] = []

  for (let i = 0; i < articles.length; i++) {
    const result = await processArticleWithAI(articles[i])
    if (result) results.push(result)
    onProgress?.(i + 1, articles.length, result)
    if (i < articles.length - 1 && shouldAttemptGemini()) {
      await sleep(BATCH_DELAY_MS)
    }
  }

  return results
}
