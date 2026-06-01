import type { RawArticle } from './newsCollector'

type MissionArticle = Pick<RawArticle, 'title' | 'summary' | 'url'> & Partial<Pick<RawArticle, 'defaultCategory'>>

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
  '입국',
  '출국명령',
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

const ACTIONABLE_MINISTRY_TERMS = [
  '법령',
  '법률',
  '법안',
  '개정',
  '시행',
  '시행령',
  '조례',
  '정책',
  '제도',
  '예산',
  '지원',
  '지원금',
  '센터',
  '가족센터',
  '다문화센터',
  '교육',
  '한국어교육',
  '복지',
  '상담',
  '통역',
  '의료',
  '주거',
  '인권',
  '차별',
  '권리',
  '노동',
  '고용',
  '임금',
  '산재',
  '체류',
  '비자',
  '출입국',
  '국적',
  '귀화',
  '영주',
  '정착',
  '보호',
  '실태조사',
  '통계',
  '보고서',
  'support',
  'policy',
  'education',
  'welfare',
  'counseling',
  'visa',
  'labor',
  'employment',
]

const MISSION_SERVICE_TERMS = [
  '선교',
  '사역',
  '교회',
  '목회',
  '예배',
  '이주민센터',
  '외국인센터',
  '쉼터',
  '무료급식',
  '구호',
]

const ELECTION_SPEECH_TERMS = [
  '후보',
  '선거',
  '출마',
  '공약',
  '지지 호소',
  '유세',
  '표심',
  '선대위',
  '캠프',
  '경선',
  '대선',
  '총선',
  '지방선거',
  '도지사 후보',
  '시장 후보',
  '군수 후보',
  '구청장 후보',
  '의원 후보',
  '교육감 후보',
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

const NATIONALITY_WORKER_PATTERN =
  /(태국|베트남|네팔|캄보디아|미얀마|필리핀|인도네시아|몽골|스리랑카|방글라데시|우즈베키스탄|중국|러시아)\s*(이주)?\s*노동자/

function includesAny(haystack: string, terms: string[]) {
  return terms.some((term) => haystack.includes(term.toLowerCase()))
}

function countHits(haystack: string, terms: string[]) {
  return terms.filter((term) => haystack.includes(term.toLowerCase())).length
}

export function buildNewsHaystack(article: MissionArticle): string {
  return [
    article.title,
    article.summary,
    article.url,
  ].join(' ').toLowerCase()
}

export function isMissionRelevantArticle(article: MissionArticle): boolean {
  const haystack = buildNewsHaystack(article)
  const title = article.title.toLowerCase()
  const titleAndUrl = [article.title, article.url].join(' ').toLowerCase()
  const hasCoreTerm = includesAny(haystack, MISSION_CORE_TERMS) || NATIONALITY_WORKER_PATTERN.test(haystack)
  const hasPolicyTerm = includesAny(haystack, IMMIGRATION_POLICY_TERMS)
  const hasActionableTerm = includesAny(haystack, ACTIONABLE_MINISTRY_TERMS)
  const hasMissionServiceTerm = includesAny(haystack, MISSION_SERVICE_TERMS)

  if (!includesAny(title, MISSION_CORE_TERMS) && includesAny(titleAndUrl, HARD_EXCLUSION_TERMS)) {
    return false
  }

  if (includesAny(titleAndUrl, ELECTION_SPEECH_TERMS)) {
    return false
  }

  if (hasCoreTerm && (hasActionableTerm || hasMissionServiceTerm)) return true

  return includesAny(haystack, IMMIGRATION_POLICY_TERMS)
    && includesAny(haystack, MINISTRY_CONTEXT_TERMS)
    && (hasActionableTerm || hasPolicyTerm)
}

export function estimateMissionRelevance(article: MissionArticle): number {
  if (!isMissionRelevantArticle(article)) return 0

  const haystack = buildNewsHaystack(article)
  const coreHits = countHits(haystack, MISSION_CORE_TERMS)
  const policyHits = countHits(haystack, IMMIGRATION_POLICY_TERMS)
  const contextHits = countHits(haystack, MINISTRY_CONTEXT_TERMS)
  const actionableHits = countHits(haystack, ACTIONABLE_MINISTRY_TERMS)
  const serviceHits = countHits(haystack, MISSION_SERVICE_TERMS)
  const sourceBoost = article.defaultCategory && article.defaultCategory !== 'OTHER' ? 8 : 0

  return Math.min(
    92,
    Math.max(55, 50 + coreHits * 5 + policyHits * 3 + contextHits + actionableHits * 4 + serviceHits * 5 + sourceBoost),
  )
}
