import { describe, expect, it } from 'vitest'
import { forumSurveySchema } from '@/schemas/forumSurvey.schema'
import { FORUM_SURVEY_QUESTIONS } from '@/lib/forumSurvey'

const valid = {
  answers: {
    attendDays: ['12월 8일(화)'],
    overall: 5,
    program: 4,
    revisit: '예',
    nps: 9,
  },
}

function messageFor(result: ReturnType<typeof forumSurveySchema.safeParse>, id: string) {
  if (result.success) return undefined
  return result.error.issues.find((i) => i.path[0] === 'answers' && i.path[1] === id)?.message
}

describe('forumSurveySchema', () => {
  it('필수 문항만 채워도 통과한다 (이름·소속 없이 무기명 제출)', () => {
    expect(forumSurveySchema.safeParse(valid).success).toBe(true)
  })

  it('필수 문항이 비면 한국어 메시지로 거부한다', () => {
    const result = forumSurveySchema.safeParse({ answers: {} })
    expect(result.success).toBe(false)
    expect(messageFor(result, 'overall')).toBe('필수 문항입니다')
    expect(messageFor(result, 'attendDays')).toBe('필수 문항입니다')
    expect(messageFor(result, 'revisit')).toBe('필수 문항입니다')
    expect(messageFor(result, 'nps')).toBe('필수 문항입니다')
  })

  it('점수 범위를 벗어나면 거부한다', () => {
    expect(forumSurveySchema.safeParse({ answers: { ...valid.answers, overall: 6 } }).success).toBe(false)
    expect(forumSurveySchema.safeParse({ answers: { ...valid.answers, overall: 0 } }).success).toBe(false)
    expect(forumSurveySchema.safeParse({ answers: { ...valid.answers, nps: 11 } }).success).toBe(false)
    expect(forumSurveySchema.safeParse({ answers: { ...valid.answers, nps: 0 } }).success).toBe(true)
  })

  it('보기에 없는 값은 거부한다', () => {
    expect(forumSurveySchema.safeParse({ answers: { ...valid.answers, revisit: '글쎄' } }).success).toBe(false)
    expect(forumSurveySchema.safeParse({ answers: { ...valid.answers, attendDays: ['12월 25일'] } }).success).toBe(false)
  })

  it('기타 보기와 기타 입력란을 받는다', () => {
    const result = forumSurveySchema.safeParse({
      answers: { ...valid.answers, role: '기타', role__other: '청년 봉사자' },
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.answers.role__other).toBe('청년 봉사자')
  })

  it('서술형은 1000자를 넘으면 거부한다', () => {
    const result = forumSurveySchema.safeParse({ answers: { ...valid.answers, improve: 'ㅁ'.repeat(1001) } })
    expect(result.success).toBe(false)
    expect(messageFor(result, 'improve')).toContain('1000자')
  })

  it('정의되지 않은 키는 버린다', () => {
    const result = forumSurveySchema.safeParse({ answers: { ...valid.answers, hacked: 'x' } })
    expect(result.success).toBe(true)
    if (result.success) expect('hacked' in result.data.answers).toBe(false)
  })

  it('문항 id가 중복되지 않는다', () => {
    const ids = FORUM_SURVEY_QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
