import { z } from 'zod'
import { POSITIONS } from './auth.schema'
import { FORUM_DAYS, FORUM_LODGING_NIGHTS } from '@/lib/forum2026'

// 직분 선택지 — 회원가입 직분 목록 + 평신도 ('기타'는 마지막)
export const FORUM_POSITIONS = [
  ...POSITIONS.filter((p) => p !== '기타'),
  '평신도',
  '기타',
] as const

const FORUM_DAY_VALUES = FORUM_DAYS.map((d) => d.value) as [string, ...string[]]
const FORUM_NIGHT_VALUES = FORUM_LODGING_NIGHTS.map((n) => n.value) as [string, ...string[]]

// 휴대폰: 010-1234-5678 / 01012345678 / 011-123-4567 등
const MOBILE_REGEX = /^01[016789]-?\d{3,4}-?\d{4}$/

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(''))

export const forum2026RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요'),
  phone: z
    .string()
    .trim()
    .min(1, '휴대폰 번호를 입력해주세요')
    .regex(MOBILE_REGEX, '올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678)'),
  email: z.string().trim().email('올바른 이메일 형식을 입력해주세요'),
  organization: z
    .string()
    .trim()
    .min(1, '소속 단체 또는 교회를 입력해주세요')
    .max(100, '소속은 100자 이하로 입력해주세요'),
  position: optionalText(50, '직분은 50자 이하로 입력해주세요'),
  region: optionalText(50, '지역은 50자 이하로 입력해주세요'),
  ministryLanguages: z.array(z.string().trim().min(1).max(50)).max(30, '언어권 선택이 너무 많습니다'),
  attendDays: z
    .array(z.enum(FORUM_DAY_VALUES, { message: '올바른 참석 일정을 선택해주세요' }))
    .min(1, '참석 일정을 1개 이상 선택해주세요'),
  // 숙박·식사는 날짜별 (둘 다 비어 있어도 됨). 참석일에 포함되는지는 아래 superRefine에서 확인
  lodgingDays: z
    .array(z.enum(FORUM_NIGHT_VALUES, { message: '올바른 숙박 날짜를 선택해주세요' }))
    .max(FORUM_NIGHT_VALUES.length, '숙박 날짜 선택이 올바르지 않습니다'),
  mealDays: z
    .array(z.enum(FORUM_DAY_VALUES, { message: '올바른 식사 날짜를 선택해주세요' }))
    .max(FORUM_DAY_VALUES.length, '식사 날짜 선택이 올바르지 않습니다'),
  depositorName: z
    .string()
    .trim()
    .min(1, '입금자명을 입력해주세요')
    .max(50, '입금자명은 50자 이하로 입력해주세요'),
  depositDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜를 선택해주세요')
    .optional()
    .or(z.literal('')),
  requests: optionalText(500, '요청사항은 500자 이하로 입력해주세요'),
  privacyAgreed: z.boolean().refine((v) => v === true, {
    message: '개인정보 수집·이용에 동의해주세요',
  }),
}).superRefine((data, ctx) => {
  if (data.lodgingDays.some((night) => !data.attendDays.includes(night))) {
    ctx.addIssue({
      code: 'custom',
      path: ['lodgingDays'],
      message: '참석하는 날짜의 밤만 숙박을 선택할 수 있습니다',
    })
  }
  if (data.mealDays.some((day) => !data.attendDays.includes(day))) {
    ctx.addIssue({
      code: 'custom',
      path: ['mealDays'],
      message: '참석하는 날짜만 식사를 선택할 수 있습니다',
    })
  }
})

export const FORUM_PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const

export const forum2026AdminUpdateSchema = z.object({
  paymentStatus: z.enum(FORUM_PAYMENT_STATUSES, { message: '올바른 입금 상태를 선택해주세요' }),
  adminMemo: z.string().trim().max(500, '메모는 500자 이하로 입력해주세요').optional().nullable(),
})

// ─── 관리자 목록·CSV 필터 (searchParams) ─────────────────────
// 잘못된 값은 에러 대신 무시(undefined)한다 — 북마크된 옛 URL도 열리도록
// 숙박·식사: Y(있음) / N(없음) / 특정 날짜(그날 숙박·식사)
const YN = ['Y', 'N'] as const

export const forum2026AdminFilterSchema = z.object({
  status: z.enum(FORUM_PAYMENT_STATUSES).optional().catch(undefined),
  q: z
    .string()
    .trim()
    .transform((v) => v.slice(0, 100) || undefined)
    .optional()
    .catch(undefined),
  day: z.enum(FORUM_DAY_VALUES).optional().catch(undefined),
  lodging: z.enum([...YN, ...FORUM_NIGHT_VALUES]).optional().catch(undefined),
  meal: z.enum([...YN, ...FORUM_DAY_VALUES]).optional().catch(undefined),
})

// CSV 내보내기 열 — 순서가 곧 CSV 열 순서
export const FORUM_EXPORT_COLUMN_KEYS = [
  'createdAt', 'name', 'phone', 'email', 'organization', 'position', 'region', 'languages',
  'days', 'lodging', 'meals', 'depositorName', 'depositDate', 'status', 'requests', 'adminMemo',
] as const

/** cols= 파라미터 목록 — 비어 있으면 전체 열, 허용 목록 밖의 값은 거부 */
export const forum2026ExportColsSchema = z
  .array(z.enum(FORUM_EXPORT_COLUMN_KEYS, { message: '알 수 없는 열이 포함되어 있습니다' }))
  .max(50, '열 선택이 너무 많습니다')
  .transform((cols) =>
    cols.length === 0 ? [...FORUM_EXPORT_COLUMN_KEYS] : FORUM_EXPORT_COLUMN_KEYS.filter((k) => cols.includes(k))
  )

export type Forum2026RegisterInput = z.infer<typeof forum2026RegisterSchema>
export type Forum2026AdminFilters = z.infer<typeof forum2026AdminFilterSchema>
export type ForumExportColumnKey = (typeof FORUM_EXPORT_COLUMN_KEYS)[number]
export type Forum2026AdminUpdateInput = z.infer<typeof forum2026AdminUpdateSchema>
