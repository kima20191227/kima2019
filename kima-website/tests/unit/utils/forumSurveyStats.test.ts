import { describe, expect, it } from 'vitest'
import { FORUM_SURVEY_QUESTIONS, getForumSurveyState } from '@/lib/forumSurvey'
import { answerToCell, computeQuestionStat } from '@/lib/forumSurveyStats'

const q = (id: string) => FORUM_SURVEY_QUESTIONS.find((x) => x.id === id)!

describe('computeQuestionStat', () => {
  it('별점 평균과 분포를 계산한다', () => {
    const stat = computeQuestionStat(q('overall'), [{ overall: 5 }, { overall: 4 }, { overall: 4 }, {}])
    expect(stat.kind).toBe('rating')
    if (stat.kind === 'rating') {
      expect(stat.count).toBe(3)
      expect(stat.average).toBe(4.3)
      expect(stat.distribution).toEqual([0, 0, 0, 2, 1])
    }
  })

  it('NPS는 추천자%−비추천자%로 계산한다', () => {
    const rows = [{ nps: 10 }, { nps: 9 }, { nps: 8 }, { nps: 6 }]
    const stat = computeQuestionStat(q('nps'), rows)
    if (stat.kind !== 'nps') throw new Error('nps expected')
    expect([stat.promoters, stat.passives, stat.detractors]).toEqual([2, 1, 1])
    expect(stat.score).toBe(25)
  })

  it('복수 선택은 응답자 수 기준으로 센다', () => {
    const stat = computeQuestionStat(q('formats'), [
      { formats: ['조별 토론', '전문가 강의'] },
      { formats: ['조별 토론'] },
      {},
    ])
    if (stat.kind !== 'choice') throw new Error('choice expected')
    expect(stat.count).toBe(2)
    expect(stat.items.find((i) => i.option === '조별 토론')?.count).toBe(2)
  })

  it('응답이 없으면 평균은 null이다', () => {
    const stat = computeQuestionStat(q('meals'), [])
    if (stat.kind !== 'rating') throw new Error('rating expected')
    expect(stat.average).toBeNull()
  })
})

describe('answerToCell', () => {
  it('기타에는 입력 내용을 붙인다', () => {
    expect(answerToCell(q('role'), { role: '기타', role__other: '청년 봉사자' })).toBe('기타(청년 봉사자)')
  })
  it('복수 선택은 / 로 잇는다', () => {
    expect(answerToCell(q('formats'), { formats: ['조별 토론', '전문가 강의'] })).toBe('조별 토론 / 전문가 강의')
  })
})

describe('getForumSurveyState', () => {
  it('시작 전·진행 중·마감을 구분한다', () => {
    expect(getForumSurveyState(new Date('2026-12-09T12:00:00+09:00'))).toBe('before')
    expect(getForumSurveyState(new Date('2026-12-10T00:00:00+09:00'))).toBe('open')
    expect(getForumSurveyState(new Date('2027-01-16T00:00:00+09:00'))).toBe('closed')
  })
})
