import { z } from 'zod'

export const answerSchema = z.object({
  content: z
    .string()
    .min(5, '답변은 5자 이상 입력해주세요'),
  questionId: z
    .string()
    .cuid('올바른 질문 ID 형식이 아닙니다'),
})

export type AnswerInput = z.infer<typeof answerSchema>
