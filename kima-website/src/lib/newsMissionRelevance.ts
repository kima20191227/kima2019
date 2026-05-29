import type { RawArticle } from './newsCollector'

const MISSION_CORE_TERMS = [
  '다문화',
  '다문화가족',
  '다문화 가정',
  '다문화 자녀',
  '결혼이민',
  '이주민',
  '이주노동',
  '외국인근로',
  '외국인 근로',
  '외국인 노동',
  '고용허가',
  '유학생',
  '외국인학생',
  '외국인 유학생',
  '난민',
  '미등록',
  '이주배경',
  '외국인주민',
  '외국인 주민',
  '이민자',
  '이민정책',
  '외국인정책',
  '사회통합',
  '한국어교육',
  '가족센터',
  '다문화센터',
  '이주여성',
  '보호외국인',
  '출입국·외국인',
  '출입국외국인',
  '외국인청',
  '계절근로',
  '국제결혼',
  '동포체류',
  '이민자네트워크',
  'multicultural',
  'migrant worker',
  'foreign worker',
  'immigrant',
  'migration',
]

const IMMIGRATION_POLICY_TERMS = [
  '출입국',
  '체류',
  '비자',
  '국적',
  '귀화',
  '영주',
  '외국인등록',
  '불법체류',
  '외국인력',
  '외국인 인력',
]

const MINISTRY_CONTEXT_TERMS = [
  '정책',
  '지원',
  '제도',
  '센터',
  '교육',
  '복지',
  '상담',
  '인권',
  '차별',
  '고용',
  '노동',
  '통계',
  '조사',
  '법무부',
  '여성가족부',
  '고용노동부',
  '행정안전부',
  '권리',
  '정착',
  '지역사회',
  '인구',
  '가족',
  '자녀',
  '근로',
  '노동자',
]

const HARD_EXCLUSION_TERMS = [
  '프로야구',
  'kbo',
  '키움',
  '히어로즈',
  '타이거즈',
  '트윈스',
  '위즈',
  '타자',
  '투수',
  '홈런',
  '선발투수',
  '스카이돔',
  '특타',
  '배트',
  '축구',
  '농구',
  '배구',
  '골프',
  'e스포츠',
  '게임',
  '주식',
  '투자자',
  '삼성전자',
  '하이닉스',
  '연예',
  '배우',
  '가수',
  '아이돌',
  '드라마',
  '광고 모델',
  '시트콤',
  '전 여자친구',
  '여친',
  '전 연인',
  '연인 관계',
  '유흥업소',
  '업소녀',
]

function includesAny(haystack: string, terms: string[]) {
  return terms.some((term) => haystack.includes(term.toLowerCase()))
}

function countHits(haystack: string, terms: string[]) {
  return terms.filter((term) => haystack.includes(term.toLowerCase())).length
}

export function buildNewsHaystack(article: RawArticle): string {
  return [
    article.title,
    article.summary,
    article.sourceName,
    article.url,
    article.keywords.join(' '),
  ].join(' ').toLowerCase()
}

export function isMissionRelevantArticle(article: RawArticle): boolean {
  const haystack = buildNewsHaystack(article)
  const title = article.title.toLowerCase()
  const titleAndUrl = [article.title, article.url].join(' ').toLowerCase()

  if (!includesAny(title, MISSION_CORE_TERMS) && includesAny(titleAndUrl, HARD_EXCLUSION_TERMS)) {
    return false
  }
  if (includesAny(haystack, MISSION_CORE_TERMS)) return true

  return includesAny(haystack, IMMIGRATION_POLICY_TERMS)
    && includesAny(haystack, MINISTRY_CONTEXT_TERMS)
}

export function estimateMissionRelevance(article: RawArticle): number {
  if (!isMissionRelevantArticle(article)) return 0

  const haystack = buildNewsHaystack(article)
  const coreHits = countHits(haystack, MISSION_CORE_TERMS)
  const policyHits = countHits(haystack, IMMIGRATION_POLICY_TERMS)
  const contextHits = countHits(haystack, MINISTRY_CONTEXT_TERMS)
  const sourceBoost = article.defaultCategory && article.defaultCategory !== 'OTHER' ? 8 : 0

  return Math.min(86, Math.max(50, 58 + coreHits * 6 + policyHits * 3 + contextHits * 2 + sourceBoost))
}
