import { z } from 'zod'
import { attachmentSchema } from './attachment.schema'

// 첨부 스키마는 attachment.schema.ts가 단일 정의처.
// 기존 import 경로 호환을 위해 re-export 유지.
export { attachmentSchema }

export const postSchema = z.object({
  title: z
    .string()
    .min(2, '제목은 2자 이상 입력해주세요')
    .max(200, '제목은 200자 이하로 입력해주세요'),
  content: z.string(),
  type: z.enum(['NOTICE', 'SHARE', 'INTRODUCE'], { message: '게시글 유형을 선택해주세요' }),
  categoryId: z.string().cuid('올바른 카테고리를 선택해주세요'),
  attachments: z.array(attachmentSchema).optional(),
})

export type PostAttachment = z.infer<typeof attachmentSchema>
export type PostInput = z.infer<typeof postSchema>
