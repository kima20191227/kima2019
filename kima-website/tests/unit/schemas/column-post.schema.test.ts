import { describe, it, expect } from 'vitest'
import { columnPostSchema } from '@/schemas/column-post.schema'

describe('columnPostSchema', () => {
  const validData = {
    title: '이주민 사역의 현장',
    content: '본문 내용입니다.',
  }

  it('유효한 입력값은 통과한다', () => {
    const result = columnPostSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('제목이 2자 미만이면 한국어 에러 메시지를 반환한다', () => {
    const result = columnPostSchema.safeParse({ ...validData, title: '가' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('title'))
      expect(err?.message).toBe('제목은 2자 이상 입력해주세요')
    }
  })

  it('본문이 비어 있으면 한국어 에러 메시지를 반환한다', () => {
    const result = columnPostSchema.safeParse({ ...validData, content: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('content'))
      expect(err?.message).toBe('본문을 입력해주세요')
    }
  })
})

describe('columnPostSchema - attachments', () => {
  const validData = {
    title: '이주민 사역의 현장',
    content: '본문 내용입니다.',
  }

  it('유효한 첨부 배열은 통과하고 isCover 값이 파싱 결과에 보존된다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [
        {
          url: 'https://example.org/cover.png',
          name: 'cover.png',
          type: 'image/png',
          isCover: true,
        },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toEqual([
        {
          url: 'https://example.org/cover.png',
          name: 'cover.png',
          type: 'image/png',
          isCover: true,
        },
      ])
      expect(result.data.attachments?.[0].isCover).toBe(true)
    }
  })

  it('isCover가 false인 첨부도 값이 그대로 보존된다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [
        {
          url: 'https://example.org/photo.png',
          name: 'photo.png',
          type: 'image/png',
          isCover: false,
        },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments?.[0].isCover).toBe(false)
    }
  })

  it('isCover가 없는 첨부도 통과한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [
        {
          url: 'https://example.org/doc.pdf',
          name: 'doc.pdf',
          type: 'application/pdf',
        },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments?.[0].isCover).toBeUndefined()
    }
  })

  it('isCover가 true인 이미지와 일반 문서가 섞인 배열도 통과하고 순서와 값이 보존된다', () => {
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
    const result = columnPostSchema.safeParse({ ...validData, attachments })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toEqual(attachments)
      expect(result.data.attachments?.[0].isCover).toBe(true)
      expect(result.data.attachments?.[1].isCover).toBeUndefined()
    }
  })

  it('attachments가 없어도 통과한다', () => {
    const result = columnPostSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toBeUndefined()
    }
  })

  it('attachments가 null이어도 통과한다', () => {
    const result = columnPostSchema.safeParse({ ...validData, attachments: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toBeNull()
    }
  })

  it('attachments가 빈 배열이어도 통과한다', () => {
    const result = columnPostSchema.safeParse({ ...validData, attachments: [] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.attachments).toEqual([])
    }
  })

  it('url이 없으면 에러를 반환한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [{ name: 'doc.pdf', type: 'application/pdf' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('url'))
      expect(err).toBeDefined()
      expect(err?.path).toEqual(['attachments', 0, 'url'])
    }
  })

  // XSS 회귀 가드 — 첨부 url은 AttachmentSection에서 href로 그대로 렌더되므로
  // javascript: 스킴이 저장되면 클릭 시 실행된다. z.url()만으로는 막히지 않으므로
  // protocol 제한(http/https)이 살아 있는지 반드시 지킨다.
  it.each([
    ['javascript 스킴', 'javascript:alert(1)'],
    ['대소문자 섞인 javascript 스킴', 'JaVaScRiPt:alert(1)'],
    ['data 스킴', 'data:text/html,<script>alert(1)</script>'],
    ['vbscript 스킴', 'vbscript:msgbox(1)'],
  ])('첨부 url에 %s이 오면 거부한다', (_label, url) => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [{ url, name: 'evil', type: 'image/png' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('url'))
      expect(err?.path).toEqual(['attachments', 0, 'url'])
    }
  })

  it('첨부 url이 상대 경로면 거부한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [{ url: '/uploads/a.png', name: 'a.png', type: 'image/png' }],
    })
    expect(result.success).toBe(false)
  })

  it('첨부 url이 http/https면 통과한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [
        { url: 'http://example.org/a.pdf', name: 'a.pdf', type: 'application/pdf' },
        { url: 'https://drive.google.com/file/d/abc/view', name: 'b.pdf', type: 'application/pdf' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('name이 없으면 에러를 반환한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [{ url: 'https://example.org/doc.pdf', type: 'application/pdf' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('name'))
      expect(err?.path).toEqual(['attachments', 0, 'name'])
    }
  })

  it('type이 없으면 에러를 반환한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [{ url: 'https://example.org/doc.pdf', name: 'doc.pdf' }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('type'))
      expect(err?.path).toEqual(['attachments', 0, 'type'])
    }
  })

  it('isCover에 boolean이 아닌 값이 오면 에러를 반환한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: [
        {
          url: 'https://example.org/cover.png',
          name: 'cover.png',
          type: 'image/png',
          isCover: 'true',
        },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('isCover'))
      expect(err?.path).toEqual(['attachments', 0, 'isCover'])
    }
  })

  it('첨부 항목이 객체가 아니면 에러를 반환한다', () => {
    const result = columnPostSchema.safeParse({
      ...validData,
      attachments: ['https://example.org/doc.pdf'],
    })
    expect(result.success).toBe(false)
  })
})
