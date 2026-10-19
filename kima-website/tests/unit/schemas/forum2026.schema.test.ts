import { describe, expect, it } from 'vitest'
import { forum2026RegisterSchema, forum2026AdminUpdateSchema } from '@/schemas/forum2026.schema'

function messageFor(result: ReturnType<typeof forum2026RegisterSchema.safeParse>, field: string) {
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe('forum2026RegisterSchema', () => {
  const validData = {
    name: '홍길동',
    phone: '010-1234-5678',
    email: 'test@kima.org',
    organization: '평택이주민교회',
    position: '목사',
    region: '경기',
    ministryLanguages: ['베트남어'],
    attendDays: ['2026-12-08', '2026-12-09'],
    needsLodging: 'Y',
    needsMeals: 'N',
    depositorName: '홍길동',
    depositDate: '2026-11-30',
    requests: '',
    privacyAgreed: true,
  }

  it('정상 입력값을 통과시킨다', () => {
    expect(forum2026RegisterSchema.safeParse(validData).success).toBe(true)
  })

  it('선택 항목이 비어 있어도 통과한다', () => {
    const result = forum2026RegisterSchema.safeParse({
      ...validData,
      position: '',
      region: '',
      ministryLanguages: [],
      depositDate: '',
      requests: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('하이픈 없는 휴대폰 번호도 통과한다', () => {
    expect(forum2026RegisterSchema.safeParse({ ...validData, phone: '01012345678' }).success).toBe(true)
  })

  it('휴대폰 형식이 아니면 한국어 에러를 반환한다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, phone: '02-123-4567' })
    expect(result.success).toBe(false)
    expect(messageFor(result, 'phone')).toBe('올바른 휴대폰 번호를 입력해주세요 (예: 010-1234-5678)')
  })

  it('이메일 형식 오류를 거부한다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, email: 'invalid' })
    expect(messageFor(result, 'email')).toBe('올바른 이메일 형식을 입력해주세요')
  })

  it('소속은 필수다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, organization: '  ' })
    expect(messageFor(result, 'organization')).toBe('소속 단체 또는 교회를 입력해주세요')
  })

  it('참석 일정은 1개 이상 선택해야 한다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, attendDays: [] })
    expect(messageFor(result, 'attendDays')).toBe('참석 일정을 1개 이상 선택해주세요')
  })

  it('행사 기간이 아닌 날짜는 거부한다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, attendDays: ['2026-12-11'] })
    expect(result.success).toBe(false)
  })

  it('숙박 여부를 선택하지 않으면 에러를 반환한다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, needsLodging: undefined })
    expect(messageFor(result, 'needsLodging')).toBe('숙박 여부를 선택해주세요')
  })

  it('입금자명은 필수다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, depositorName: '' })
    expect(messageFor(result, 'depositorName')).toBe('입금자명을 입력해주세요')
  })

  it('요청사항은 500자 이하여야 한다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, requests: '가'.repeat(501) })
    expect(messageFor(result, 'requests')).toBe('요청사항은 500자 이하로 입력해주세요')
  })

  it('개인정보 동의가 없으면 거부한다', () => {
    const result = forum2026RegisterSchema.safeParse({ ...validData, privacyAgreed: false })
    expect(messageFor(result, 'privacyAgreed')).toBe('개인정보 수집·이용에 동의해주세요')
  })
})

describe('forum2026AdminUpdateSchema', () => {
  it('올바른 상태값과 메모를 통과시킨다', () => {
    expect(forum2026AdminUpdateSchema.safeParse({ paymentStatus: 'CONFIRMED', adminMemo: '11/30 입금' }).success).toBe(true)
  })

  it('알 수 없는 상태값을 거부한다', () => {
    expect(forum2026AdminUpdateSchema.safeParse({ paymentStatus: 'PAID' }).success).toBe(false)
  })
})
