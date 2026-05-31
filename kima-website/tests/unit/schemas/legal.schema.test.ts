import { describe, expect, it } from 'vitest'
import { legalDocumentSchema, legalDocumentSectionSchema } from '@/schemas/legal.schema'

describe('legalDocumentSchema', () => {
  const validData = {
    title: '출입국관리법 주요 조항 안내',
    summary: '현장 실무자가 자주 확인하는 체류 관련 조항을 정리했습니다.',
    content: '## 핵심 내용\n\n- 체류자격 확인\n- 변경 신청 절차',
    category: 'IMMIGRATION',
    lawType: '법률',
    effectiveDate: '2026-01-01',
    sourceUrl: 'https://www.law.go.kr/법령/출입국관리법',
    sourceId: '001234',
    isLatest: true,
    accessLevel: 'PUBLIC',
  }

  it('유효한 법령 문서 입력값을 통과시킨다', () => {
    const result = legalDocumentSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('제목이 너무 짧으면 한국어 오류를 반환한다', () => {
    const result = legalDocumentSchema.safeParse({ ...validData, title: '법' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('제목은 2자 이상 입력해주세요')
    }
  })

  it('본문이 너무 짧으면 오류를 반환한다', () => {
    const result = legalDocumentSchema.safeParse({ ...validData, content: '짧음' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const contentError = result.error.issues.find((issue) => issue.path.includes('content'))
      expect(contentError?.message).toBe('본문은 10자 이상 입력해주세요')
    }
  })

  it('올바르지 않은 원문 URL을 거부한다', () => {
    const result = legalDocumentSchema.safeParse({ ...validData, sourceUrl: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const urlError = result.error.issues.find((issue) => issue.path.includes('sourceUrl'))
      expect(urlError?.message).toBe('올바른 URL 형식을 입력해주세요')
    }
  })

  it('빈 선택 필드는 생략할 수 있다', () => {
    const result = legalDocumentSchema.safeParse({
      ...validData,
      summary: '',
      lawType: '',
      effectiveDate: '',
      sourceUrl: '',
      sourceId: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.summary).toBeUndefined()
      expect(result.data.lawType).toBeUndefined()
      expect(result.data.effectiveDate).toBeUndefined()
      expect(result.data.sourceUrl).toBeUndefined()
      expect(result.data.sourceId).toBeUndefined()
    }
  })

  it('API 법령 ID가 너무 길면 오류를 반환한다', () => {
    const result = legalDocumentSchema.safeParse({ ...validData, sourceId: '1'.repeat(101) })
    expect(result.success).toBe(false)
    if (!result.success) {
      const sourceIdError = result.error.issues.find((issue) => issue.path.includes('sourceId'))
      expect(sourceIdError?.message).toBe('API 법령 ID는 100자 이하로 입력해주세요')
    }
  })

  it('권한별 법령 섹션 입력값을 검증한다', () => {
    const result = legalDocumentSectionSchema.safeParse({
      type: 'PRACTICAL_GUIDE',
      title: '실무 해설',
      content: '사역 현장에서 자주 묻는 질문과 신청 절차를 정리합니다.',
      accessLevel: 'MEMBER',
      order: 2,
      authorName: 'KIMA',
      reviewedAt: '2026-05-31',
    })

    expect(result.success).toBe(true)
  })
})
