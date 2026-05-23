import { z } from 'zod'

export const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  type: z.string(),
})

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
