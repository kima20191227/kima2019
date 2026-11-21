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
    .replace(/&middot;/g, '·')
    .replace(/&hellip;/g, '…')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim()
}

function hasTruncatedText(input: string): boolean {
  return /(\.\.\.|…)/.test(input)
}

function decodeJsonString(input: string): string {
  try {
    return JSON.parse(`"${input.replace(/"/g, '\\"')}"`)
  } catch {
    return input
  }
}

function extractMetaContent(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  )
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["'][^>]*>`,
    'i',
  )
  return stripHtml(re.exec(html)?.[1] ?? alt.exec(html)?.[1] ?? '')
}

function extractJsonLdArticleBody(html: string): string {
  const match = html.match(/"articleBody"\s*:\s*"((?:\\.|[^"\\]){80,5000})"/i)
  return match ? stripHtml(decodeJsonString(match[1])) : ''
}

function extractParagraphPreview(html: string): string {
  const matches = [...html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
  const paragraphs = matches
    .map((match) => stripHtml(match[1]))
    .filter((text) => isUsefulArticlePreview(text))
    .slice(0, 4)

  return paragraphs.join(' ')
}

function isUsefulArticlePreview(text: string): boolean {
  if (text.length < 80) return false
  if (/[{}]|\$\{|\.substring|byteLen|function\s*\(|var\s+|const\s+/i.test(text)) return false
  if (/internet explorer|browser|최신 브라우저|사용을 권장|구독|저작권|무단전재|copyright/i.test(text)) return false
  return true
}

export async function fetchArticleSummaryPreview(url: string): Promise<string> {
  if (!/^https?:\/\//i.test(url)) return ''

  try {
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 KIMA-NewsBot/1.0 (+https://kima2019.org)',
          Accept: 'text/html,application/xhtml+xml,*/*',
        },
        cache: 'no-store',
      },
      5_000,
    )

    if (!res.ok) return ''

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('html') && !contentType.includes('text')) return ''

    const html = (await res.text()).slice(0, 300_000)
    const candidates = [
      extractJsonLdArticleBody(html),
      extractMetaContent(html, 'og:description'),
      extractMetaContent(html, 'description'),
      extractParagraphPreview(html),
    ]
      .map((text) => stripHtml(text))
      .filter((text) => isUsefulArticlePreview(text))
      .sort((a, b) => {
        const aScore = (hasTruncatedText(a) ? -1000 : 0) + a.length
        const bScore = (hasTruncatedText(b) ? -1000 : 0) + b.length
        return bScore - aScore
      })

    return candidates[0]?.slice(0, 1000).trim() ?? ''
  } catch {
    return ''
  }
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

  // 사이트맵 <loc>
  const loc = itemXml.match(
    /<loc[^>]*>\s*(?:<!\[CDATA\[)?\s*(https?:\/\/[^\s<\]"]+)/i,
  )
  if (loc) return loc[1].trim()

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

  // Google News 사이트맵 <url> (RSS·Atom 모두 없는 경우)
  // 예: 국민일보 https://www.kmib.co.kr/rss/data/sitemap/recentArticlelist.xml
  //     — 섹션 RSS에 없는 '더미션' 등 전 섹션 기사가 최근 48시간치 포함된다.
  if (results.length === 0) {
    const urlRe = /<url>([\s\S]*?)<\/url>/gi
    while ((m = urlRe.exec(xml)) !== null) {
      if (/<news:news[\s>]/i.test(m[1])) results.push(m[1])
    }
  }

  return results
}

/**
 * 날짜 문자열 → Date (파싱 실패 시 현재 시각)
 */
export function parseDate(s: string): Date {
  if (!s) return new Date()
  const normalized = s
    .trim()
    // 크리스천투데이: "Sat, 21 Nov 2026 06:54:28 KST" — JS는 KST를 모른다
    .replace(/\bKST$/i, '+0900')
    // CBS노컷뉴스: "Sat, 21 11 2026 09:38:22 +0900" — 월이 숫자
    .replace(
      /^(?:[A-Za-z]{3},\s*)?(\d{1,2})\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*([+-]\d{4})?$/,
      (_m, day: string, month: string, year: string, time: string, tz?: string) => {
        const offset = tz ? `${tz.slice(0, 3)}:${tz.slice(3)}` : '+09:00'
        const hms = time.length <= 5 ? `${time}:00` : time
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hms.padStart(8, '0')}${offset}`
      },
    )
  const d = new Date(normalized)
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
    // 상한은 키워드 필터 '이후'에 적용한다. 필터 전에 자르면 수백 건짜리
    // 피드·사이트맵에서 앞쪽 일부만 검사되어 관련 기사가 누락된다.
    const items = parseRSSItems(xml)

    const articles: RawArticle[] = []

    for (const item of items) {
      if (articles.length >= maxItems) break

      const title = extractTag(item, 'title') || extractTag(item, 'news:title')
      // Atom은 <summary> 또는 <content>. 사이트맵은 요약이 없다(수집 후 본문에서 보강).
      const summary =
        extractTag(item, 'description') ||
        extractTag(item, 'summary') ||
        extractTag(item, 'content')
      const url = extractUrl(item)
      const pubDate =
        extractTag(item, 'pubDate') ||
        extractTag(item, 'published') ||
        extractTag(item, 'updated') ||
        extractTag(item, 'news:publication_date')

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
