// 포럼 설문 집계 — 관리자 화면과 CSV 내보내기가 같은 정의를 쓴다.
import {
  FORUM_SURVEY_OTHER,
  FORUM_SURVEY_QUESTIONS,
  getChoiceOptions,
  otherKey,
  type ForumSurveyQuestion,
} from '@/lib/forumSurvey'

export type SurveyAnswers = Record<string, unknown>

export interface RatingStat {
  kind: 'rating'
  question: ForumSurveyQuestion
  count: number
  average: number | null
  /** 1~5점 각각의 응답 수 (인덱스 0 = 1점) */
  distribution: number[]
}

export interface NpsStat {
  kind: 'nps'
  question: ForumSurveyQuestion
  count: number
  average: number | null
  promoters: number // 9~10
  passives: number // 7~8
  detractors: number // 0~6
  /** NPS = 추천자% − 비추천자% (응답 없으면 null) */
  score: number | null
}

export interface ChoiceStat {
  kind: 'choice'
  question: ForumSurveyQuestion
  /** 응답한 사람 수 (복수 선택도 1명으로 셈) */
  count: number
  items: { option: string; count: number }[]
  /** '기타'에 직접 적은 내용 */
  others: string[]
}

export interface TextStat {
  kind: 'text'
  question: ForumSurveyQuestion
  count: number
  items: string[]
}

export type QuestionStat = RatingStat | NpsStat | ChoiceStat | TextStat

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const round1 = (n: number) => Math.round(n * 10) / 10

export function computeQuestionStat(q: ForumSurveyQuestion, rows: readonly SurveyAnswers[]): QuestionStat {
  switch (q.type) {
    case 'rating': {
      const values = rows.map((r) => r[q.id]).filter(isNumber).filter((n) => n >= 1 && n <= 5)
      const distribution = [1, 2, 3, 4, 5].map((n) => values.filter((v) => v === n).length)
      const sum = values.reduce((a, b) => a + b, 0)
      return {
        kind: 'rating',
        question: q,
        count: values.length,
        average: values.length ? round1(sum / values.length) : null,
        distribution,
      }
    }
    case 'nps': {
      const values = rows.map((r) => r[q.id]).filter(isNumber).filter((n) => n >= 0 && n <= 10)
      const promoters = values.filter((v) => v >= 9).length
      const detractors = values.filter((v) => v <= 6).length
      const sum = values.reduce((a, b) => a + b, 0)
      return {
        kind: 'nps',
        question: q,
        count: values.length,
        average: values.length ? round1(sum / values.length) : null,
        promoters,
        passives: values.length - promoters - detractors,
        detractors,
        score: values.length ? Math.round(((promoters - detractors) / values.length) * 100) : null,
      }
    }
    case 'single':
    case 'multi': {
      const options = getChoiceOptions(q)
      const counts = new Map<string, number>(options.map((o) => [o, 0]))
      let respondents = 0
      for (const r of rows) {
        const v = r[q.id]
        const picked = (Array.isArray(v) ? v : typeof v === 'string' ? [v] : []).filter(
          (x): x is string => typeof x === 'string' && counts.has(x)
        )
        if (picked.length === 0) continue
        respondents++
        for (const p of new Set(picked)) counts.set(p, (counts.get(p) ?? 0) + 1)
      }
      const others = q.allowOther
        ? rows
            .map((r) => r[otherKey(q.id)])
            .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
        : []
      return {
        kind: 'choice',
        question: q,
        count: respondents,
        items: options.map((option) => ({ option, count: counts.get(option) ?? 0 })),
        others,
      }
    }
    case 'text': {
      const items = rows
        .map((r) => r[q.id])
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      return { kind: 'text', question: q, count: items.length, items }
    }
  }
}

export function computeSurveyStats(rows: readonly SurveyAnswers[]): QuestionStat[] {
  return FORUM_SURVEY_QUESTIONS.map((q) => computeQuestionStat(q, rows))
}

/** CSV 셀에 넣을 문자열 — 복수 선택은 ' / '로 잇고, 기타 입력은 '기타(내용)'로 합친다 */
export function answerToCell(q: ForumSurveyQuestion, answers: SurveyAnswers): string {
  const v = answers[q.id]
  if (v === undefined || v === null) return ''
  if (q.type === 'rating' || q.type === 'nps') return isNumber(v) ? String(v) : ''
  if (q.type === 'text') return typeof v === 'string' ? v : ''

  const picked = (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === 'string')
  const other = answers[otherKey(q.id)]
  return picked
    .map((p) => (p === FORUM_SURVEY_OTHER && typeof other === 'string' && other.trim() ? `${p}(${other.trim()})` : p))
    .join(' / ')
}
