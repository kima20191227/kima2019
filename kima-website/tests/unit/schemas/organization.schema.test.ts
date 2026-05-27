import { describe, it, expect } from 'vitest'
import { organizationSchema } from '@/schemas/organization.schema'

describe('organizationSchema', () => {
  const validData = {
    name: '한국이주민선교연합회',
    region: '서울',
    languages: ['베트남어'],
    targets: ['이주노동자'],
  }

  it('유효한 입력값은 통과한다', () => {
    const result = organizationSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('languages 배열이 비어있으면 에러를 반환한다', () => {
    const result = organizationSchema.safeParse({ ...validData, languages: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('languages'))
      expect(err?.message).toBe('언어권을 1개 이상 선택해주세요')
    }
  })

  it('targets 배열이 비어있으면 에러를 반환한다', () => {
    const result = organizationSchema.safeParse({ ...validData, targets: [] })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('targets'))
      expect(err?.message).toBe('사역대상을 1개 이상 선택해주세요')
    }
  })

  it('website가 URL 형식이 아니면 에러를 반환한다', () => {
    const result = organizationSchema.safeParse({ ...validData, website: 'not-a-url' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('website'))
      expect(err?.message).toBe('올바른 URL 형식을 입력해주세요')
    }
  })

  it('website가 빈 문자열이면 통과한다', () => {
    const result = organizationSchema.safeParse({ ...validData, website: '' })
    expect(result.success).toBe(true)
  })

  it('website가 유효한 URL이면 통과한다', () => {
    const result = organizationSchema.safeParse({ ...validData, website: 'https://example.org' })
    expect(result.success).toBe(true)
  })

  it('email이 올바른 형식이 아니면 에러를 반환한다', () => {
    const result = organizationSchema.safeParse({ ...validData, email: 'not-an-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('email'))
      expect(err?.message).toBe('올바른 이메일 형식을 입력해주세요')
    }
  })

  it('email이 빈 문자열이면 통과한다', () => {
    const result = organizationSchema.safeParse({ ...validData, email: '' })
    expect(result.success).toBe(true)
  })

  it('단체명이 없으면 에러를 반환한다', () => {
    const result = organizationSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('name'))
      expect(err).toBeDefined()
    }
  })

  it('복수의 languages와 targets도 통과한다', () => {
    const result = organizationSchema.safeParse({
      ...validData,
      languages: ['베트남어', '네팔어', '몽골어'],
      targets: ['이주노동자', '유학생'],
    })
    expect(result.success).toBe(true)
  })

  it('선택 항목(nameEn, description, type, address)은 없어도 통과한다', () => {
    const result = organizationSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('nameEn에 한글이 포함되면 에러를 반환한다', () => {
    const result = organizationSchema.safeParse({ ...validData, nameEn: '한글이름' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const err = result.error.issues.find((i) => i.path.includes('nameEn'))
      expect(err?.message).toBe('영문, 숫자, 공백, 하이픈만 입력 가능합니다')
    }
  })
})
