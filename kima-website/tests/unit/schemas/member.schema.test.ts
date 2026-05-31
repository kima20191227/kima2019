import { describe, expect, it } from 'vitest'
import { updateProfileSchema } from '@/schemas/member.schema'

describe('updateProfileSchema', () => {
  const validData = {
    name: '홍길동',
    position: '목사',
    phone: '010-1234-5678',
    denomination: '예장통합',
    organization: 'KIMA',
    address: '서울시 강남구',
    region: '서울',
    ministryLanguages: ['베트남어'],
    ministryTargets: ['이주노동자'],
  }

  it('마이페이지 수정 입력값을 통과시킨다', () => {
    const result = updateProfileSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('이름은 2자 이상이어야 한다', () => {
    const result = updateProfileSchema.safeParse({ ...validData, name: '홍' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const error = result.error.issues.find((issue) => issue.path.includes('name'))
      expect(error?.message).toBe('이름은 2자 이상 입력해주세요')
    }
  })

  it('사역 언어와 사역 대상은 최소 1개 이상이어야 한다', () => {
    const result = updateProfileSchema.safeParse({
      ...validData,
      ministryLanguages: [],
      ministryTargets: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('사역 언어를 1개 이상 입력해주세요')
      expect(messages).toContain('사역 대상을 1개 이상 입력해주세요')
    }
  })
})
