import { z } from 'zod'
import { POSITIONS } from './auth.schema'

const REGIONS = [
  '서울',
  '경기',
  '인천',
  '부산경남',
  '대구경북',
  '광주전라',
  '대전충청',
  '강원',
  '제주',
  '기타',
] as const

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(''))

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요'),
  position: z.enum(POSITIONS, { message: '직분을 선택해주세요' }).optional().or(z.literal('')),
  phone: z
    .string()
    .trim()
    .min(1, '전화번호를 입력해주세요')
    .max(20, '전화번호는 20자 이하로 입력해주세요'),
  denomination: optionalText(100, '교단명은 100자 이하로 입력해주세요'),
  organization: optionalText(100, '단체명은 100자 이하로 입력해주세요'),
  address: optionalText(200, '주소는 200자 이하로 입력해주세요'),
  region: z.enum(REGIONS, { message: '올바른 지역을 선택해주세요' }).optional().or(z.literal('')),
  ministryLanguages: z.array(z.string().trim().min(1)).min(1, '사역 언어를 1개 이상 입력해주세요'),
  ministryTargets: z.array(z.string().trim().min(1)).min(1, '사역 대상을 1개 이상 입력해주세요'),
})

export const premiumRequestSchema = z.object({
  depositorName: z.string().min(1, '입금자명을 입력해주세요'),
  depositedAt: z.string().min(1, '입금일을 선택해주세요'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type PremiumRequestInput = z.infer<typeof premiumRequestSchema>
export { REGIONS }
