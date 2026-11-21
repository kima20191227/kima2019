import { describe, expect, it } from 'vitest'
import { findMajorOutlet, hasMigrationTopicInTitle, selectTopNews, type TopNewsCandidate } from '@/lib/majorNewsOutlets'

const NOW = new Date('2026-11-21T03:00:00.000Z') // KST 12:00

function hoursAgo(h: number) {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000)
}

function candidate(id: string, url: string, h: number, summary: string | null = '요약'): TopNewsCandidate {
  return { id, title: `이주민 기사 ${id}`, summary, sourceUrl: url, publishedAt: hoursAgo(h) }
}

describe('findMajorOutlet', () => {
  it.each([
    ['https://www.kmib.co.kr/article/20261119502330', '국민일보'],
    ['https://www.nocutnews.co.kr/news/123', 'CBS노컷뉴스'],
    ['https://www.christiantoday.co.kr/news/1', '크리스천투데이'],
    ['https://www.chosun.com/national/2026/11/20/x/', '조선일보'],
    ['https://www.joongang.co.kr/article/1', '중앙일보'],
    ['https://www.donga.com/news/article/all/1', '동아일보'],
    ['https://news.kbs.co.kr/news/view.do?ncd=1', 'KBS'],
  ])('%s → %s', (url, name) => {
    expect(findMajorOutlet(url)?.name).toBe(name)
  })

  it('비주요 매체·유사 도메인·스포츠 하위 매체는 제외한다', () => {
    expect(findMajorOutlet('https://www.news1.kr/1')).toBeNull()
    expect(findMajorOutlet('https://news.tvchosun.com/1')).toBeNull()
    expect(findMajorOutlet('https://fakechosun.com/1')).toBeNull()
    expect(findMajorOutlet('https://sports.donga.com/1')).toBeNull()
    expect(findMajorOutlet('not a url')).toBeNull()
  })
})

describe('selectTopNews', () => {
  it('주요 언론사 기사만 최신순으로 고른다', () => {
    const { items, windowHours } = selectTopNews([
      candidate('a', 'https://www.news1.kr/1', 1),
      candidate('b', 'https://www.chosun.com/1', 5),
      candidate('c', 'https://www.kmib.co.kr/article/1', 2),
    ], { now: NOW, minItems: 1 })

    expect(items.map((i) => i.id)).toEqual(['c', 'b'])
    expect(windowHours).toBe(24)
  })

  it('언론사당 건수를 제한한다', () => {
    const many = Array.from({ length: 6 }, (_, i) => candidate(`k${i}`, `https://www.kmib.co.kr/article/${i}`, i + 1))
    const { items } = selectTopNews(
      [...many, candidate('d', 'https://www.donga.com/1', 10)],
      { now: NOW, perOutlet: 2, minItems: 1 },
    )

    expect(items.map((i) => i.id)).toEqual(['k0', 'k1', 'd'])
  })

  it('24시간 안의 기사가 부족하면 기간을 넓히고 그 사실을 알린다', () => {
    const { items, windowHours } = selectTopNews([
      candidate('today', 'https://www.kmib.co.kr/article/1', 3),
      candidate('older', 'https://www.chosun.com/1', 40),
      candidate('tooOld', 'https://www.donga.com/1', 100),
    ], { now: NOW, minItems: 3, fallbackHours: 72 })

    expect(items.map((i) => i.id)).toEqual(['today', 'older'])
    expect(windowHours).toBe(72)
  })

  it('같은 시각이면 기독교 언론을 먼저 둔다', () => {
    const { items } = selectTopNews([
      candidate('major', 'https://www.chosun.com/1', 2),
      candidate('christian', 'https://www.kmib.co.kr/article/1', 2),
    ], { now: NOW, minItems: 1 })

    expect(items.map((i) => i.id)).toEqual(['christian', 'major'])
  })

  it('limit 을 넘지 않는다', () => {
    const list = Array.from({ length: 30 }, (_, i) => candidate(`n${i}`, `https://www.yna.co.kr/${i}`, 1))
      .concat(Array.from({ length: 30 }, (_, i) => candidate(`h${i}`, `https://www.hani.co.kr/${i}`, 1)))
    expect(selectTopNews(list, { now: NOW, limit: 4, perOutlet: 10 }).items).toHaveLength(4)
  })
})

describe('hasMigrationTopicInTitle', () => {
  it.each([
    '다문화 소녀를 봉사자로 이끈 ‘멘토의 8년 돌봄’',
    '‘조센징’으로 겪은 차별과 혐오…외국인 눈에 비친 지금 우리 모습은',
    '혐오 아닌 함께하는 교회…한일 천주교 다문화 공존 모색',
    '베트남 출신 엄마들의 한국어 교실',
    '고용허가제 20년, 이주노동자의 현실',
  ])('포함: %s', (title) => {
    expect(hasMigrationTopicInTitle(title)).toBe(true)
  })

  it.each([
    '[책의 향기]무역 위해 내준 땅 ‘조계’, 침략 거점 됐다',
    '매일유업, 자선바자회 수익금 전액 기부…입양원·미혼모 시설 지원',
    '눈높이를 낮추면 보입니다…세상을 바꾸는 보통의 기술',
  ])('제외: %s', (title) => {
    expect(hasMigrationTopicInTitle(title)).toBe(false)
  })

  it('제목에 주제가 없으면 코너에서 뺀다', () => {
    const offTopic = { ...candidate('x', 'https://www.donga.com/1', 1), title: '매일유업 자선바자회' }
    expect(selectTopNews([offTopic], { now: NOW, minItems: 1 }).items).toHaveLength(0)
  })
})
