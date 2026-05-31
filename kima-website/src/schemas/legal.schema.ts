import { z } from 'zod'

export const legalCategoryValues = [
  'MULTICULTURAL_FAMILY',
  'IMMIGRATION',
  'VISA_POLICY',
  'REFUGEE',
  'EMPLOYMENT',
  'SOCIAL_WELFARE',
  'OTHER',
] as const

export const legalSectionTypeValues = [
  'OVERVIEW',
  'SOURCE_LINKS',
  'PRACTICAL_GUIDE',
  'EXPERT_MATERIAL',
] as const

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || undefined)
  .pipe(z.string().url('올바른 URL 형식을 입력해주세요').optional())

const optionalDate = z.preprocess((value) => {
  if (value === '' || value == null) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'string') return new Date(value)
  return value
}, z.date('올바른 날짜를 입력해주세요').optional())

const optionalText = (max: number, message: string) => z
  .string()
  .trim()
  .max(max, message)
  .optional()
  .nullable()
  .transform((value) => value || undefined)

export const legalDocumentSectionSchema = z.object({
  type: z.enum(legalSectionTypeValues, { message: '섹션 유형을 선택해주세요' }),
  title: z
    .string()
    .trim()
    .min(2, '섹션 제목은 2자 이상 입력해주세요')
    .max(100, '섹션 제목은 100자 이하로 입력해주세요'),
  content: z
    .string()
    .trim()
    .min(1, '섹션 내용을 입력해주세요'),
  accessLevel: z.enum(['PUBLIC', 'MEMBER', 'PREMIUM'], {
    message: '섹션 접근 등급을 선택해주세요',
  }),
  order: z
    .number()
    .int('정렬 순서는 정수로 입력해주세요')
    .min(0, '정렬 순서는 0 이상이어야 합니다')
    .default(0),
  authorName: optionalText(100, '작성자명은 100자 이하로 입력해주세요'),
  reviewedAt: optionalDate,
})

export const legalDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, '제목은 2자 이상 입력해주세요')
    .max(200, '제목은 200자 이하로 입력해주세요'),
  summary: optionalText(500, '요약은 500자 이하로 입력해주세요'),
  content: z
    .string()
    .trim()
    .min(10, '본문은 10자 이상 입력해주세요'),
  category: z.enum(legalCategoryValues, { message: '법령 카테고리를 선택해주세요' }),
  lawType: optionalText(30, '법령 유형은 30자 이하로 입력해주세요'),
  effectiveDate: optionalDate,
  sourceUrl: optionalUrl,
  sourceId: optionalText(100, 'API 법령 ID는 100자 이하로 입력해주세요'),
  isLatest: z.boolean().default(true),
  accessLevel: z.enum(['PUBLIC', 'MEMBER', 'PREMIUM'], {
    message: '접근 등급을 선택해주세요',
  }).default('PUBLIC'),
  sections: z.array(legalDocumentSectionSchema).optional(),
})

export type LegalDocumentInput = z.infer<typeof legalDocumentSchema>
export type LegalDocumentSectionInput = z.infer<typeof legalDocumentSectionSchema>
