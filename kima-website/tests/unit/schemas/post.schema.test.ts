import { describe, it, expect } from 'vitest'
import { postSchema, attachmentSchema } from '@/schemas/post.schema'

describe('attachmentSchema', () => {
  it('유효한 첨부는 통과하고 isCover 값이 보존된다', () => {
    const result = attachmentSchema.safeParse({
      url: 'https://example.org/cover.png',
      name: 'cover.png',
      type: 'image/png',
      isCover: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isCover).toBe(true)
    }
  })

  it('isCover가 없어도 통과한다', () => {
    const result = attachmentSchema.safeParse({
      url: 'https://example.org/doc.pdf',
      name: 'doc.pdf',
      type: 'application/pdf',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isCover).toBeUndefined()
    }
  })

  it('url이 URL 형식이 아니면 에러를 반환한다', () => {
    const result = attachmentSchema.safeParse({
      url: 'not-a-url',
      name: 'doc.pdf',
      type: 'application/pdf',
    })
    expect(result.success).toBe(false)
  })

  it('isCover에 boolean이 아닌 값이 오면 에러를 반환한다', () => {
    const result = attachmentSchema.safeParse({
      url: 'https://example.org/cover.png',
      name: 'cover.png',
      type: 'image/png',
      isCover: 'true',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('isCover'))
      expect(err).toBeDefined()
    }
  })
})

describe('postSchema', () => {
  const validData = {
    title: '사역 나눔 공지',
    content: '본문 내용입니다.',
    type: 'NOTICE',
    categoryId: 'clh1234567890abcdefghijk',
  }

  it('유효한 입력값은 통과한다', () => {
    const result = postSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('제목이 2자 미만이면 한국어 에러 메시지를 반환한다', () => {
    const result = postSchema.safeParse({ ...validData, title: '가' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('title'))
      expect(err?.message).toBe('제목은 2자 이상 입력해주세요')
    }
  })

  it('type이 허용된 값이 아니면 한국어 에러 메시지를 반환한다', () => {
    const result = postSchema.safeParse({ ...validData, type: 'UNKNOWN' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('type'))
      expect(err?.message).toBe('게시글 유형을 선택해주세요')
    }
  })

  it('categoryId가 cuid 형식이 아니면 한국어 에러 메시지를 반환한다', () => {
    const result = postSchema.safeParse({ ...validData, categoryId: 'not-a-cuid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('categoryId'))
      expect(err?.message).toBe('올바른 카테고리를 선택해주세요')
    }
  })

  it('attachments의 isCover가 파싱 결과에 보존된다', () => {
    const attachments = [
      {
        url: 'https://example.org/cover.jpg',
        name: 'cover.jpg',
        type: 'image/jpeg',
        isCover: true,
      },
      {
        url: 'https://example.org/report.pdf',
        name: 'report.pdf',
        type: 'application/pdf',
      },
    ]
    const result = postSchema.safeParse({ ...validData, attachments })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toEqual(attachments)
      expect(result.data.attachments?.[0].isCover).toBe(true)
    }
  })

  it('attachments가 없어도 통과한다', () => {
    const result = postSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toBeUndefined()
    }
  })

  it('attachments가 빈 배열이어도 통과한다', () => {
    const result = postSchema.safeParse({ ...validData, attachments: [] })
    expect(result.success).toBe(true)
  })

  it('attachments에 필수 키가 누락되면 에러를 반환한다', () => {
    const result = postSchema.safeParse({
      ...validData,
      attachments: [{ url: 'https://example.org/doc.pdf' }],
    })
    expect(result.success).toBe(false)
  })
})
