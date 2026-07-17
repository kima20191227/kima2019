import { z } from 'zod'

// 첨부 파일 공통 스키마 — post·column·story·question·answer가 함께 사용하는 단일 정의처.
// 업로드 경로는 항상 절대 URL(Supabase publicUrl 또는 구글 드라이브 URL)을 반환한다.
//
// protocol을 http/https로 제한하는 것은 XSS 방어다. 첨부 url은 AttachmentSection에서
// href로 그대로 렌더되므로, javascript: 스킴이 저장되면 클릭 시 실행된다.
// z.url()만으로는 막을 수 없다 — javascript:/data:/vbscript: 모두 통과하므로
// protocol 제한이 반드시 함께 있어야 한다.
export const attachmentSchema = z.object({
  url: z.url({
    protocol: /^https?$/,
    message: '올바른 파일 URL 형식을 입력해주세요 (http/https만 허용)',
  }),
  name: z.string({ message: '파일 이름을 입력해주세요' }),
  type: z.string({ message: '파일 형식을 입력해주세요' }),
  // 대표 이미지 여부 — 목록 썸네일 선택에 사용. 절대 누락하지 말 것.
  isCover: z.boolean({ message: '대표 이미지 여부는 true 또는 false여야 합니다' }).optional(),
})

export type Attachment = z.infer<typeof attachmentSchema>
