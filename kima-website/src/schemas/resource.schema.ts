import { z } from 'zod'

export const resourceSectionValues = ['KIMA', 'MINISTRY', 'PUBLIC'] as const
export type ResourceSectionValue = (typeof resourceSectionValues)[number]

export const resourceSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이하로 입력해주세요'),
  description: z.string().max(500, '설명은 500자 이하로 입력해주세요').optional(),
  driveUrl: z.string().url('올바른 URL 형식을 입력해주세요'),
  fileType: z.string().optional(),
  // 자료실 큰 구분 (미전송 시 PUBLIC 기본값)
  section: z.enum(resourceSectionValues, { message: '자료 구분을 선택해주세요' }).default('PUBLIC'),
  accessLevel: z.enum(['PUBLIC', 'MEMBER', 'PREMIUM'], { message: '접근 등급을 선택해주세요' }),
  categoryId: z.string().cuid('올바른 카테고리를 선택해주세요').optional(),
})

export type ResourceInput = z.infer<typeof resourceSchema>
