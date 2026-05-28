import { z } from 'zod'
import { attachmentSchema } from './post.schema'

export const questionSchema = z.object({
  title: z
    .string()
    .min(2, '제목은 2자 이상 입력해주세요')
    .max(200, '제목은 200자 이하로 입력해주세요'),
  content: z
    .string()
    .min(10, '내용은 10자 이상 입력해주세요'),
  thumbnail: z.string().url().optional().nullable(),
  attachments: z.array(attachmentSchema).optional(),
})

export const questionStatusSchema = z.enum(['PENDING', 'ANSWERED'])

export type QuestionInput = z.infer<typeof questionSchema>
export type QuestionStatusValue = z.infer<typeof questionStatusSchema>
