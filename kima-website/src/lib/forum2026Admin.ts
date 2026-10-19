// 2026 KIMA 포럼 관리자 — 목록 페이지와 CSV 내보내기가 같은 필터·조건을 쓰도록 한곳에 모은다.
import type { ForumPaymentStatus, ForumRegistration, Prisma } from '@prisma/client'
import {
  FORUM_DAYS,
  FORUM_KEY,
  FORUM_LODGING_NIGHTS,
  FORUM_MEAL_DAYS,
  formatForumDayNumbers,
  getForumDayLabel,
  getForumNightLabel,
} from '@/lib/forum2026'
import {
  forum2026AdminFilterSchema,
  type Forum2026AdminFilters,
  type ForumExportColumnKey,
} from '@/schemas/forum2026.schema'

export const FORUM_STATUS_LABELS: Record<ForumPaymentStatus, string> = {
  PENDING: '입금대기',
  CONFIRMED: '입금확인',
  CANCELLED: '취소',
}

type RawSearchParams = Record<string, string | string[] | undefined>

/** searchParams → 필터 (잘못된 값은 무시) */
export function parseForumAdminFilters(raw: RawSearchParams): Forum2026AdminFilters {
  const first = (key: string) => {
    const value = raw[key]
    return Array.isArray(value) ? value[0] : value
  }
  return forum2026AdminFilterSchema.parse({
    status: first('status'),
    q: first('q'),
    day: first('day'),
    lodging: first('lodging'),
    meal: first('meal'),
  })
}

/** 휴대폰 번호 비교용 — 숫자만 남긴다 */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

// DB의 phone은 formatPhone()으로 저장된다: 11자리 3-4-4, 10자리 3-3-4.
// 숫자만 입력된 검색어가 하이픈을 가로질러도 맞도록, 저장 형식에서 나올 수 있는 부분 문자열을 만든다.
const PHONE_LAYOUTS = [
  { total: 11, hyphensBefore: [3, 7] },
  { total: 10, hyphensBefore: [3, 6] },
]

export function phoneSearchPatterns(query: string): string[] {
  const digits = normalizePhone(query)
  if (digits.length < 3) return []
  const patterns = new Set<string>()
  for (const { total, hyphensBefore } of PHONE_LAYOUTS) {
    for (let start = 0; start + digits.length <= total; start++) {
      let pattern = ''
      for (let i = 0; i < digits.length; i++) {
        if (i > 0 && hyphensBefore.includes(start + i)) pattern += '-'
        pattern += digits[i]
      }
      patterns.add(pattern)
    }
  }
  return [...patterns]
}

// ─── 숙박·식사 (날짜별) ─────────────────────────────────
type ForumStayFields = Pick<ForumRegistration, 'attendDays' | 'lodgingDays' | 'mealDays' | 'needsLodging' | 'needsMeals'>

const NIGHT_VALUES: readonly string[] = FORUM_LODGING_NIGHTS.map((n) => n.value)
const MEAL_DAY_VALUES: readonly string[] = FORUM_MEAL_DAYS.map((d) => d.value)

/**
 * 신청 건의 실제 숙박 밤·식사 날짜 (정렬·허용값만).
 * 구 형식(lodgingDays/mealDays 도입 전) 행은 배열이 비어 있고 needsLodging/needsMeals만 있으므로,
 * 숙박함 → 참석한 날 중 숙박 가능한 모든 밤, 식사함 → 참석한 모든 날로 본다.
 * 집계·목록·상세·CSV·필터 모두 이 함수만 거친다.
 */
export function getForumStay(r: ForumStayFields): { lodgingDays: string[]; mealDays: string[] } {
  const lodging = r.lodgingDays.length > 0 ? r.lodgingDays : r.needsLodging ? r.attendDays : []
  const meals = r.mealDays.length > 0 ? r.mealDays : r.needsMeals ? r.attendDays : []
  return {
    lodgingDays: NIGHT_VALUES.filter((v) => lodging.includes(v)),
    mealDays: MEAL_DAY_VALUES.filter((v) => meals.includes(v)),
  }
}

/** 목록용 요약 — '숙박 8·9일 / 식사 8·9·10일' (없으면 '숙박 없음') */
export function formatForumStayShort(r: ForumStayFields) {
  const { lodgingDays, mealDays } = getForumStay(r)
  const lodging = lodgingDays.length ? `숙박 ${formatForumDayNumbers(lodgingDays)}` : '숙박 없음'
  const meals = mealDays.length ? `식사 ${formatForumDayNumbers(mealDays)}` : '식사 없음'
  return `${lodging} / ${meals}`
}

/** 상세·CSV용 — 날짜 라벨 목록 (없으면 '') */
export function formatForumLodgingLabels(r: ForumStayFields) {
  return getForumStay(r).lodgingDays.map(getForumNightLabel).join(', ')
}

export function formatForumMealLabels(r: ForumStayFields) {
  return getForumStay(r).mealDays.map(getForumDayLabel).join(', ')
}

function matchesStayFilter(days: string[], filter: string | undefined) {
  if (!filter) return true
  if (filter === 'Y') return days.length > 0
  if (filter === 'N') return days.length === 0
  return days.includes(filter)
}

/**
 * 숙박·식사 필터 — 구 형식 보정(getForumStay)이 필요해 DB where 대신 메모리에서 거른다.
 * (신청 건수가 많지 않아 전체 조회 후 필터링해도 부담이 없다)
 */
export function filterForumRowsByStay<T extends ForumStayFields>(
  rows: T[],
  filters: Pick<Forum2026AdminFilters, 'lodging' | 'meal'>
): T[] {
  if (!filters.lodging && !filters.meal) return rows
  return rows.filter((r) => {
    const stay = getForumStay(r)
    return matchesStayFilter(stay.lodgingDays, filters.lodging) && matchesStayFilter(stay.mealDays, filters.meal)
  })
}

/** 필터 → Prisma where (숙박·식사 제외 — filterForumRowsByStay 사용). ignoreStatus는 상태 탭별 건수 계산용 */
export function buildForumAdminWhere(
  filters: Forum2026AdminFilters,
  { ignoreStatus = false }: { ignoreStatus?: boolean } = {}
): Prisma.ForumRegistrationWhereInput {
  const where: Prisma.ForumRegistrationWhereInput = { forumKey: FORUM_KEY }
  if (filters.status && !ignoreStatus) where.paymentStatus = filters.status
  if (filters.day) where.attendDays = { has: filters.day }
  if (filters.q) {
    const contains = { contains: filters.q, mode: 'insensitive' as const }
    where.OR = [
      { name: contains },
      { depositorName: contains },
      { organization: contains },
      { email: contains },
      { phone: { contains: filters.q } },
      ...phoneSearchPatterns(filters.q).map((p) => ({ phone: { contains: p } })),
    ]
  }
  return where
}

/** 필터를 유지한 채 일부만 바꾼 쿼리스트링 (`?a=b` 또는 '') */
export function forumAdminQueryString(
  filters: Forum2026AdminFilters,
  overrides: Partial<Forum2026AdminFilters> = {}
) {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()
  for (const key of ['status', 'q', 'day', 'lodging', 'meal'] as const) {
    const value = merged[key]
    if (value) params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export function hasForumAdminSearch(filters: Forum2026AdminFilters) {
  return Boolean(filters.q || filters.day || filters.lodging || filters.meal)
}

/** 같은 휴대폰 번호(숫자 기준)로 2건 이상 신청된 번호 집합 */
export function findDuplicatePhones(rows: Pick<ForumRegistration, 'phone'>[]) {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const key = normalizePhone(r.phone)
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([key]) => key))
}

/** 일자별 참석·숙박(그날 밤)·식사 인원 (취소 제외). 숙박 없는 날(마지막 날)은 lodging: null */
export function forumDayCounts(rows: (Pick<ForumRegistration, 'paymentStatus'> & ForumStayFields)[]) {
  const active = rows
    .filter((r) => r.paymentStatus !== 'CANCELLED')
    .map((r) => ({ attendDays: r.attendDays, ...getForumStay(r) }))
  return FORUM_DAYS.map((d) => ({
    value: d.value,
    label: d.label,
    attend: active.filter((r) => r.attendDays.includes(d.value)).length,
    lodging: NIGHT_VALUES.includes(d.value) ? active.filter((r) => r.lodgingDays.includes(d.value)).length : null,
    meals: active.filter((r) => r.mealDays.includes(d.value)).length,
  }))
}

export function formatKst(date: Date | null, withTime = false) {
  if (!date) return ''
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  })
}

// ─── CSV 열 정의 ─────────────────────────────────────────
interface ExportColumn {
  label: string
  headers: string[]
  cells: (r: ForumRegistration) => string[]
}

export const FORUM_EXPORT_COLUMNS: Record<ForumExportColumnKey, ExportColumn> = {
  createdAt: { label: '신청일시', headers: ['신청일시'], cells: (r) => [formatKst(r.createdAt, true)] },
  name: { label: '이름', headers: ['이름'], cells: (r) => [r.name] },
  phone: { label: '휴대폰', headers: ['휴대폰'], cells: (r) => [r.phone] },
  email: { label: '이메일', headers: ['이메일'], cells: (r) => [r.email] },
  organization: { label: '소속', headers: ['소속'], cells: (r) => [r.organization] },
  position: { label: '직분', headers: ['직분'], cells: (r) => [r.position ?? ''] },
  region: { label: '사역지역', headers: ['사역지역'], cells: (r) => [r.region ?? ''] },
  languages: { label: '사역언어권', headers: ['사역언어권'], cells: (r) => [r.ministryLanguages.join(', ')] },
  days: {
    label: '참석일',
    headers: FORUM_DAYS.map((d) => d.label),
    cells: (r) => FORUM_DAYS.map((d) => (r.attendDays.includes(d.value) ? 'O' : '')),
  },
  lodging: { label: '숙박일', headers: ['숙박일'], cells: (r) => [formatForumLodgingLabels(r)] },
  meals: { label: '식사일', headers: ['식사일'], cells: (r) => [formatForumMealLabels(r)] },
  depositorName: { label: '입금자명', headers: ['입금자명'], cells: (r) => [r.depositorName] },
  depositDate: { label: '입금예정일', headers: ['입금예정일'], cells: (r) => [formatKst(r.depositDate)] },
  status: { label: '입금상태', headers: ['입금상태'], cells: (r) => [FORUM_STATUS_LABELS[r.paymentStatus]] },
  requests: { label: '요청사항', headers: ['요청사항'], cells: (r) => [r.requests ?? ''] },
  adminMemo: { label: '관리메모', headers: ['관리메모'], cells: (r) => [r.adminMemo ?? ''] },
}
