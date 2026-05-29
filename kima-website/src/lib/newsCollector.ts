/**
 * newsCollector.ts
 * Edge Runtime 전용 뉴스 수집기
 * - Node.js 전용 모듈(fs, path, rss-parser) 사용 금지
 * - 오직 fetch API + 정규식 기반 XML 파싱
 * - Cloudflare Pages Edge Runtime / Next.js Edge Runtime 호환
 */

import { cfEnv } from './cfEnv'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

export interface RawArticle {
  title: string
  summary: string
  url: string
  sourceName: string
  publishedAt: Date
  keywords: string[]   // 일치한 필터 키워드 목록
  defaultCategory?: string
}

interface NaverNewsItem {
  title: string
  description: string
  link: string
  originallink?: string
  pubDate: string
}

interface NaverNewsResponse {
  total: number
  start: number
  display: number
  items: NaverNewsItem[]
}

// ─── 내부 유틸리티 ────────────────────────────────────────────────────────────

/**
 * CDATA 래퍼 제거 + HTML 태그 제거 + 공백 정리
 */
function stripHtml(input: string): string {
  if (!input) return ''

  // CDATA: <![CDATA[ ... ]]>
  const cdata = input.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  const raw = cdata ? cdata[1] : input

  return raw
    .replace(/<[^>]+>/g, '')   // HTML 태그 제거
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * XML에서 특정 태그 내용 추출 (CDATA 포함, 첫 번째 매치만)
 */
function extractTag(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    'i',
  )
  const m = xml.match(re)
  return m ? stripHtml(m[1]) : ''
}

/**
 * RSS item 블록 내에서 URL 추출
 * - <link> (CDATA 있을 수도, 없을 수도)
 * - <guid isPermaLink="true">
 */
function extractUrl(itemXml: string): string {
  // <link> — CDATA 없는 텍스트 노드 (표준 RSS 2.0)
  const linkText = itemXml.match(
    /<link[^>]*>\s*(?:<!\[CDATA\[)?\s*(https?:\/\/[^\s<\]"]+)/i,
  )
  if (linkText) return linkText[1].trim()

  // <guid isPermaLink="true"> 또는 URL처럼 보이는 guid
  const guid = itemXml.match(
    /<guid[^>]*>\s*(?:<!\[CDATA\[)?\s*(https?:\/\/[^\s<\]"]+)/i,
  )
  if (guid) return guid[1].trim()

  // Atom 계열 <id>
  const id = itemXml.match(
    /<id[^>]*>\s*(?:<!\[CDATA\[)?\s*(https?:\/\/[^\s<\]"]+)/i,
  )
  if (id) return id[1].trim()

  return ''
}

/**
 * RSS XML 전체에서 <item> 블록 배열 반환
 * Atom 피드의 경우 <entry> 블록도 대응
 */
function parseRSSItems(xml: string): string[] {
  const results: string[] = []

  // RSS 2.0 <item>
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) results.push(m[1])

  // Atom <entry> (RSS 아이템이 없는 경우)
  if (results.length === 0) {
    const entryRe = /<entry[^>]*>([\s\S]*?)<\/entry>/gi
    while ((m = entryRe.exec(xml)) !== null) results.push(m[1])
  }

  return results
}

/**
 * 날짜 문자열 → Date (파싱 실패 시 현재 시각)
 */
function parseDate(s: string): Date {
  if (!s) return new Date()
  const d = new Date(s.trim())
  return isNaN(d.getTime()) ? new Date() : d
}

/**
 * 텍스트에 키워드가 하나라도 포함되면 true
 * 빈 키워드 배열이면 항상 true (필터 없음)
 */
function matchesKeywords(text: string, keywords: string[]): boolean {
  if (!keywords.length) return true
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}

/**
 * 일치한 키워드 목록 반환
 */
function matchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()))
}

/**
 * AbortController 기반 타임아웃 fetch
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

// ─── 공개 함수 ────────────────────────────────────────────────────────────────

/**
 * RSS/Atom 피드를 fetch → 정규식 파싱 → 키워드 필터링
 *
 * @param rssUrl        RSS 피드 URL
 * @param sourceName    출처 매체명 (News.sourceName 에 저장)
 * @param filterKeywords 필터 키워드 (빈 배열 = 전체 수집)
 * @param maxItems      최대 수집 건수 (default 30)
 * @returns RawArticle[]
 */
export async function fetchRSSFeed(
  rssUrl: string,
  sourceName: string,
  filterKeywords: string[] = [],
  maxItems = 30,
): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(
      rssUrl,
      {
        headers: {
          'User-Agent': 'KIMA-NewsBot/1.0 (+https://kima2019.org)',
          Accept:
            'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
        },
        // Edge Runtime: Next.js 캐시 비활성화
        cache: 'no-store',
      },
      10_000,
    )

    if (!res.ok) {
      console.error(`[newsCollector] RSS ${res.status}: ${rssUrl}`)
      return []
    }

    const xml = await res.text()
    const items = parseRSSItems(xml).slice(0, maxItems)

    const articles: RawArticle[] = []

    for (const item of items) {
      const title = extractTag(item, 'title')
      // Atom은 <summary> 또는 <content>
      const summary =
        extractTag(item, 'description') ||
        extractTag(item, 'summary') ||
        extractTag(item, 'content')
      const url = extractUrl(item)
      const pubDate =
        extractTag(item, 'pubDate') ||
        extractTag(item, 'published') ||
        extractTag(item, 'updated')

      if (!title || !url) continue

      const combined = `${title} ${summary}`
      if (!matchesKeywords(combined, filterKeywords)) continue

      articles.push({
        title,
        summary: summary.slice(0, 600),
        url,
        sourceName,
        publishedAt: parseDate(pubDate),
        keywords: matchedKeywords(combined, filterKeywords),
      })
    }

    return articles
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('abort') || msg.toLowerCase().includes('timeout')) {
      console.error(`[newsCollector] RSS timeout (10s): ${rssUrl}`)
    } else {
      console.error(`[newsCollector] RSS error (${rssUrl}): ${msg}`)
    }
    return []
  }
}

/**
 * 네이버 뉴스 검색 API 호출
 * 환경변수: NAVER_NEWS_CLIENT_ID, NAVER_NEWS_CLIENT_SECRET
 *
 * @param query         검색어 (예: "이주민 다문화")
 * @param sourceName    출처명 (default "네이버 뉴스")
 * @param display       결과 수 (max 100)
 * @param filterKeywords 2차 필터 키워드 (API 결과 내 재필터)
 * @returns RawArticle[]
 */
export async function fetchNaverNews(
  query: string,
  sourceName = '네이버 뉴스',
  display = 20,
  filterKeywords: string[] = [],
): Promise<RawArticle[]> {
  const clientId     = cfEnv('NAVER_NEWS_CLIENT_ID')     ?? ''
  const clientSecret = cfEnv('NAVER_NEWS_CLIENT_SECRET') ?? ''

  if (!clientId || !clientSecret) {
    console.warn('[newsCollector] NAVER_NEWS_CLIENT_ID/SECRET 환경변수 미설정')
    return []
  }

  try {
    const params = new URLSearchParams({
      query,
      display: String(Math.min(Math.max(display, 1), 100)),
      start:   '1',
      sort:    'date',   // date(최신순) | sim(관련도순)
    })

    const res = await fetchWithTimeout(
      `https://openapi.naver.com/v1/search/news.json?${params.toString()}`,
      {
        headers: {
          'X-Naver-Client-Id':     clientId,
          'X-Naver-Client-Secret': clientSecret,
          'Accept':                'application/json',
        },
        cache: 'no-store',
      },
      10_000,
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(
        `[newsCollector] Naver API ${res.status}: ${body.slice(0, 200)}`,
      )
      return []
    }

    const data = (await res.json()) as NaverNewsResponse

    return data.items
      .filter((item) => {
        const combined = `${stripHtml(item.title)} ${stripHtml(item.description)}`
        return matchesKeywords(combined, filterKeywords)
      })
      .map((item) => {
        const title   = stripHtml(item.title)
        const summary = stripHtml(item.description)
        const combined = `${title} ${summary}`
        return {
          title,
          summary: summary.slice(0, 600),
          url:         item.originallink?.trim() || item.link.trim(),
          sourceName,
          publishedAt: parseDate(item.pubDate),
          keywords:    matchedKeywords(combined, filterKeywords),
        }
      })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('abort') || msg.toLowerCase().includes('timeout')) {
      console.error('[newsCollector] Naver API timeout (10s)')
    } else {
      console.error('[newsCollector] Naver API error:', msg)
    }
    return []
  }
}

/**
 * URL 기준 중복 제거 유틸리티
 */
export function deduplicateArticles(articles: RawArticle[]): RawArticle[] {
  const seen = new Set<string>()
  return articles.filter((a) => {
    const key = a.url.replace(/[?#].*$/, '').toLowerCase()   // 쿼리스트링 제거 후 비교
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
