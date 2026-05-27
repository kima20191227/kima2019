import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/schemas/auth.schema'

describe('loginSchema', () => {
  it('유효한 입력값은 통과한다', () => {
    const result = loginSchema.safeParse({
      email: 'test@kima.org',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('이메일 형식이 올바르지 않으면 에러를 반환한다', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('올바른 이메일 형식을 입력해주세요')
    }
  })

  it('비밀번호가 8자 미만이면 에러를 반환한다', () => {
    const result = loginSchema.safeParse({
      email: 'test@kima.org',
      password: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('비밀번호는 8자 이상 입력해주세요')
    }
  })
})

describe('registerSchema', () => {
  const validData = {
    name: '홍길동',
    email: 'test@kima.org',
    password: 'password123',
    passwordConfirm: 'password123',
    position: '목사',
    phone: '010-1234-5678',
    address: '서울시 강남구',
    denomination: '예장합동',
    organization: '한국이주민선교연합회',
    ministryLanguages: ['베트남어'],
    ministryTargets: ['이주노동자'],
  }

  it('유효한 입력값은 통과한다', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('이름이 2자 미만이면 에러를 반환한다', () => {
    const result = registerSchema.safeParse({ ...validData, name: '홍' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'))
      expect(nameError?.message).toBe('이름은 2자 이상 입력해주세요')
    }
  })

  it('이메일 형식이 올바르지 않으면 에러를 반환한다', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'invalid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path.includes('email'))
      expect(emailError?.message).toBe('올바른 이메일 형식을 입력해주세요')
    }
  })

  it('비밀번호가 8자 미만이면 에러를 반환한다', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'abc1',
      passwordConfirm: 'abc1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path.includes('password'))
      expect(pwError?.message).toBe('비밀번호는 8자 이상 입력해주세요')
    }
  })

  it('비밀번호가 불일치하면 에러를 반환한다', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'password123',
      passwordConfirm: 'different123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirmError = result.error.issues.find((i) =>
        i.path.includes('passwordConfirm')
      )
      expect(confirmError?.message).toBe('비밀번호가 일치하지 않습니다')
    }
  })

  it('한국어 에러 메시지가 출력된다', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'invalid',
      password: '',
      passwordConfirm: '',
      position: '',
      phone: '',
      address: '',
      denomination: '',
      ministryLanguages: [],
      ministryTargets: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message)
      messages.forEach((msg) => {
        expect(/[가-힣]/.test(msg)).toBe(true)
      })
    }
  })

  it('organization은 선택 항목이다', () => {
    const { organization: _, ...withoutOrg } = validData
    const result = registerSchema.safeParse(withoutOrg)
    expect(result.success).toBe(true)
  })
})
