import { z } from 'zod'
import { POSITIONS } from './auth.schema'
import { FORUM_DAYS } from '@/lib/forum2026'

// 직분 선택지 — 회원가입 직분 목록 + 평신도 ('기타'는 마지막)
export const FORUM_POSITIONS = [
  ...POSITIONS.filter((p) => p !== '기타'),
  '평신도',
  '기타',
] as const

const FORUM_DAY_VALUES = FORUM_DAYS.map((d) => d.value) as [string, ...string[]]

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
  needsLodging: z.enum(['Y', 'N'], { message: '숙박 여부를 선택해주세요' }),
  needsMeals: z.enum(['Y', 'N'], { message: '식사 여부를 선택해주세요' }),
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
})

export const FORUM_PAYMENT_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'] as const

export const forum2026AdminUpdateSchema = z.object({
  paymentStatus: z.enum(FORUM_PAYMENT_STATUSES, { message: '올바른 입금 상태를 선택해주세요' }),
  adminMemo: z.string().trim().max(500, '메모는 500자 이하로 입력해주세요').optional().nullable(),
})

export type Forum2026RegisterInput = z.infer<typeof forum2026RegisterSchema>
export type Forum2026AdminUpdateInput = z.infer<typeof forum2026AdminUpdateSchema>
