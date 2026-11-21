import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRSSFeed } from '@/lib/newsCollector'

vi.mock('@/lib/cfEnv', () => ({ cfEnv: vi.fn() }))

function mockFetchXml(xml: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(xml, { status: 200, headers: { 'content-type': 'text/xml' } })),
  )
}

function sitemapUrl(id: string, title: string, date = '2026-11-20T03:00:00+09:00') {
  return `
  <url>
    <loc>https://www.kmib.co.kr/article/${id}</loc>
    <news:news>
      <news:publication><news:name>국민일보</news:name><news:language>ko</news:language></news:publication>
      <news:publication_date>${date}</news:publication_date>
      <news:title><![CDATA[${title}]]></news:title>
    </news:news>
  </url>`
}

function sitemap(...urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join('\n')}
</urlset>`
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchRSSFeed — 구글 뉴스 사이트맵', () => {
  it('<url> 블록에서 제목·URL·발행일을 추출한다', async () => {
    mockFetchXml(sitemap(sitemapUrl('20261119502330', '다문화 소녀를 봉사자로 이끈 ‘멘토의 8년 돌봄’')))

    const articles = await fetchRSSFeed('https://example.com/sitemap.xml', '국민일보', ['다문화'])

    expect(articles).toHaveLength(1)
    expect(articles[0]).toMatchObject({
      title: '다문화 소녀를 봉사자로 이끈 ‘멘토의 8년 돌봄’',
      url: 'https://www.kmib.co.kr/article/20261119502330',
      sourceName: '국민일보',
      summary: '',
      keywords: ['다문화'],
    })
    expect(articles[0].publishedAt.toISOString()).toBe('2026-11-19T18:00:00.000Z')
  })

  it('키워드 필터를 먼저 적용한 뒤 상한을 건다 (앞쪽 기사만 검사하지 않는다)', async () => {
    const unrelated = Array.from({ length: 60 }, (_, i) => sitemapUrl(`2026112050${String(i).padStart(4, '0')}`, `정치 기사 ${i}`))
    mockFetchXml(sitemap(...unrelated, sitemapUrl('20261119502330', '다문화 가정 멘토링')))

    const articles = await fetchRSSFeed('https://example.com/sitemap.xml', '국민일보', ['다문화'], 50)

    expect(articles.map((a) => a.url)).toEqual(['https://www.kmib.co.kr/article/20261119502330'])
  })

  it('maxItems는 필터를 통과한 기사 수에 적용된다', async () => {
    const matching = Array.from({ length: 5 }, (_, i) => sitemapUrl(`2026112050000${i}`, `이주민 기사 ${i}`))
    mockFetchXml(sitemap(...matching))

    const articles = await fetchRSSFeed('https://example.com/sitemap.xml', '국민일보', ['이주민'], 3)

    expect(articles).toHaveLength(3)
  })
})

describe('fetchRSSFeed — RSS 2.0', () => {
  it('기존 RSS <item> 파싱은 그대로 동작한다', async () => {
    mockFetchXml(`<rss><channel>
      <item>
        <title>외국인 근로자 지원 확대</title>
        <link>https://www.kmib.co.kr/article/1</link>
        <description><![CDATA[고용허가제 개선]]></description>
        <pubDate><![CDATA[ 20 Nov 2026 23:52:52 GMT ]]></pubDate>
      </item>
    </channel></rss>`)

    const articles = await fetchRSSFeed('https://example.com/rss.xml', '국민일보', ['외국인'])

    expect(articles).toHaveLength(1)
    expect(articles[0].summary).toBe('고용허가제 개선')
    expect(articles[0].publishedAt.toISOString()).toBe('2026-11-20T23:52:52.000Z')
  })
})
