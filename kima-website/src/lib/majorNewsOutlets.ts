/**
 * '오늘의 주요 뉴스' 코너용 주요 언론사 목록과 선정 로직.
 *
 * 수집된 News.sourceName 은 수집기 이름("네이버 뉴스 — 이주민" 등)이라
 * 실제 언론사를 알 수 없다. 그래서 기사 URL 의 도메인으로 언론사를 판별한다.
 *
 * CTS 기독교TV(cts.tv)는 robots.txt 가 검색엔진 외 모든 봇을 차단하고
 * 뉴스 RSS 도 제공하지 않아 수집 대상에서 제외했다. 네이버 검색 등으로
 * 들어오는 경우에 대비해 목록에는 남겨 둔다.
 */

export type OutletGroup = 'christian' | 'major'

export interface MajorOutlet {
  name: string
  domains: string[]
  group: OutletGroup
}

export const MAJOR_NEWS_OUTLETS: MajorOutlet[] = [
  // 기독교 언론
  { name: '국민일보',     domains: ['kmib.co.kr'],                       group: 'christian' },
  { name: 'CBS노컷뉴스',  domains: ['nocutnews.co.kr', 'cbs.co.kr'],     group: 'christian' },
  { name: 'CTS',         domains: ['cts.tv'],                            group: 'christian' },
  { name: '크리스천투데이', domains: ['christiantoday.co.kr'],            group: 'christian' },
  { name: '기독일보',     domains: ['christiandaily.co.kr'],              group: 'christian' },
  { name: '뉴스앤조이',   domains: ['newsnjoy.or.kr'],                    group: 'christian' },
  { name: '기독신문',     domains: ['kidok.com'],                         group: 'christian' },
  { name: '가톨릭평화방송', domains: ['cpbc.co.kr'],                      group: 'christian' },
  // 종합 일간지·통신·방송
  { name: '조선일보',     domains: ['chosun.com'],                        group: 'major' },
  { name: '중앙일보',     domains: ['joongang.co.kr'],                    group: 'major' },
  { name: '동아일보',     domains: ['donga.com'],                         group: 'major' },
  { name: '한겨레',       domains: ['hani.co.kr'],                        group: 'major' },
  { name: '경향신문',     domains: ['khan.co.kr'],                        group: 'major' },
  { name: '한국일보',     domains: ['hankookilbo.com'],                   group: 'major' },
  { name: '서울신문',     domains: ['seoul.co.kr'],                       group: 'major' },
  { name: '세계일보',     domains: ['segye.com'],                         group: 'major' },
  { name: '문화일보',     domains: ['munhwa.com'],                        group: 'major' },
  { name: '연합뉴스',     domains: ['yna.co.kr'],                         group: 'major' },
  { name: 'KBS',         domains: ['news.kbs.co.kr'],                    group: 'major' },
  { name: 'MBC',         domains: ['imnews.imbc.com'],                   group: 'major' },
  { name: 'SBS',         domains: ['news.sbs.co.kr'],                    group: 'major' },
  { name: 'YTN',         domains: ['ytn.co.kr'],                         group: 'major' },
]

/** 'sports.donga.com' 처럼 본지와 성격이 다른 하위 매체는 제외한다. */
const EXCLUDED_HOSTS = ['sports.donga.com', 'sports.chosun.com', 'sports.khan.co.kr', 'sports.hankooki.com']

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

export function findMajorOutlet(url: string): MajorOutlet | null {
  const host = hostnameOf(url)
  if (!host || EXCLUDED_HOSTS.includes(host)) return null

  return MAJOR_NEWS_OUTLETS.find((outlet) =>
    outlet.domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
  ) ?? null
}

/** DB 1차 필터용 — 정확한 판별은 findMajorOutlet 이 한다. */
export const MAJOR_OUTLET_DOMAINS = MAJOR_NEWS_OUTLETS.flatMap((outlet) => outlet.domains)

/**
 * 코너는 제목만 보여주므로, 제목만 봐도 이주·다문화 기사임을 알 수 있어야 한다.
 * 본문 요약 덕에 관련성 필터를 통과한 기사(예: 기업 자선바자회, 근대사 서평)는 제외된다.
 */
const TITLE_TOPIC_PATTERN = new RegExp(
  [
    '다문화', '이주', '이민', '외국인', '난민', '유학생', '결혼이민', '고려인', '탈북',
    '미등록', '고용허가', '출입국', '비자', '귀화', '국적', '동포', '조선족',
    '계절근로', '외국 국적', '이방인', '나그네',
    '(태국|베트남|네팔|캄보디아|미얀마|필리핀|인도네시아|몽골|스리랑카|방글라데시|우즈베키스탄|카자흐스탄|중국|러시아) ?(인|출신|국적|근로자|노동자|여성|학생|아동)',
  ].join('|'),
)

export function hasMigrationTopicInTitle(title: string): boolean {
  return TITLE_TOPIC_PATTERN.test(title)
}

export interface TopNewsCandidate {
  id: string
  title: string
  summary: string | null
  sourceUrl: string
  publishedAt: Date
}

export interface TopNewsItem extends TopNewsCandidate {
  outlet: MajorOutlet
}

export interface SelectTopNewsOptions {
  now?: Date
  limit?: number
  /** 한 언론사가 코너를 독점하지 않도록 언론사당 최대 건수 */
  perOutlet?: number
  /** 이 시간 안의 기사가 minItems 미만이면 fallbackHours 까지 넓힌다 */
  windowHours?: number
  fallbackHours?: number
  minItems?: number
}

export interface TopNewsSelection {
  items: TopNewsItem[]
  /** 실제로 적용된 기간(시간). 24 면 '오늘', 그보다 길면 '최근' 으로 표기 */
  windowHours: number
}

/**
 * 제목에 이주·다문화 주제가 드러나는 주요 언론사 기사만 골라 최신순으로 정렬하고, 언론사별 건수를 제한한다.
 * 같은 시각이면 기독교 언론을 앞에 둔다.
 */
export function selectTopNews(
  candidates: TopNewsCandidate[],
  {
    now = new Date(),
    limit = 10,
    perOutlet = 3,
    windowHours = 24,
    fallbackHours = 72,
    minItems = 5,
  }: SelectTopNewsOptions = {},
): TopNewsSelection {
  const withOutlet: TopNewsItem[] = []
  for (const candidate of candidates) {
    if (!hasMigrationTopicInTitle(candidate.title)) continue
    const outlet = findMajorOutlet(candidate.sourceUrl)
    if (outlet) withOutlet.push({ ...candidate, outlet })
  }

  withOutlet.sort((a, b) => {
    const diff = b.publishedAt.getTime() - a.publishedAt.getTime()
    if (diff !== 0) return diff
    return Number(b.outlet.group === 'christian') - Number(a.outlet.group === 'christian')
  })

  function pick(hours: number): TopNewsItem[] {
    const since = now.getTime() - hours * 60 * 60 * 1000
    const counts = new Map<string, number>()
    const picked: TopNewsItem[] = []
    for (const item of withOutlet) {
      if (picked.length >= limit) break
      const time = item.publishedAt.getTime()
      if (time < since || time > now.getTime() + 60 * 60 * 1000) continue
      const count = counts.get(item.outlet.name) ?? 0
      if (count >= perOutlet) continue
      counts.set(item.outlet.name, count + 1)
      picked.push(item)
    }
    return picked
  }

  const primary = pick(windowHours)
  if (primary.length >= minItems || fallbackHours <= windowHours) {
    return { items: primary, windowHours }
  }
  return { items: pick(fallbackHours), windowHours: fallbackHours }
}
