import { z } from 'zod'

export const columnPostSchema = z.object({
  title: z
    .string()
    .min(2, '제목은 2자 이상 입력해주세요')
    .max(200, '제목은 200자 이하로 입력해주세요'),
  content: z
    .string()
    .min(1, '본문을 입력해주세요'),
  authorName: z
    .string()
    .max(100, '작성자 이름은 100자 이하로 입력해주세요')
    .optional()
    .nullable(),
  excerpt: z
    .string()
    .max(300, '요약은 300자 이하로 입력해주세요')
    .optional()
    .nullable(),
  thumbnail: z
    .string()
    .url('올바른 이미지 URL 형식을 입력해주세요')
    .optional()
    .nullable(),
  imageUrls: z
    .array(z.string().url('올바른 이미지 URL 형식을 입력해주세요'))
    .optional(),
  fileUrls: z
    .array(z.string().url('올바른 파일 URL 형식을 입력해주세요'))
    .optional(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        name: z.string(),
        type: z.string(),
      }),
    )
    .optional()
    .nullable(),
  tags: z
    .array(z.string().max(30, '태그는 30자 이하로 입력해주세요'))
    .optional(),
})

export type ColumnPostInput = z.infer<typeof columnPostSchema>
