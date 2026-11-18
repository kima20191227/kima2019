import { z } from 'zod'
import {
  FORUM_SURVEY_OTHER_MAX,
  FORUM_SURVEY_QUESTIONS,
  FORUM_SURVEY_TEXT_MAX,
  getChoiceOptions,
  otherKey,
  type ForumSurveyQuestion,
} from '@/lib/forumSurvey'

// 문항 정의(src/lib/forumSurvey.ts)에서 검증 스키마를 만든다.
// 폼(React Hook Form)과 API가 같은 스키마를 공유한다.

const REQUIRED_MESSAGE = '필수 문항입니다'

function buildAnswerSchema(q: ForumSurveyQuestion): z.ZodType {
  let schema: z.ZodType
  switch (q.type) {
    case 'rating':
      schema = z.number({ message: REQUIRED_MESSAGE }).int().min(1, '1~5점 중에서 선택해주세요').max(5, '1~5점 중에서 선택해주세요')
      break
    case 'nps':
      schema = z.number({ message: REQUIRED_MESSAGE }).int().min(0, '0~10점 중에서 선택해주세요').max(10, '0~10점 중에서 선택해주세요')
      break
    case 'single': {
      const options = getChoiceOptions(q) as [string, ...string[]]
      schema = z.enum(options, { message: q.required ? REQUIRED_MESSAGE : '올바른 보기를 선택해주세요' })
      break
    }
    case 'multi': {
      const options = getChoiceOptions(q) as [string, ...string[]]
      schema = z
        .array(z.enum(options, { message: '올바른 보기를 선택해주세요' }), { message: REQUIRED_MESSAGE })
        .max(options.length, '선택이 올바르지 않습니다')
      if (q.required) schema = (schema as z.ZodArray<z.ZodType>).min(1, REQUIRED_MESSAGE)
      break
    }
    case 'text':
      schema = z.string().trim().max(FORUM_SURVEY_TEXT_MAX, `${FORUM_SURVEY_TEXT_MAX}자 이하로 입력해주세요`)
      break
  }
  return q.required ? schema : schema.optional().or(z.literal(''))
}

const answerShape: Record<string, z.ZodType> = {}
for (const q of FORUM_SURVEY_QUESTIONS) {
  answerShape[q.id] = buildAnswerSchema(q)
  if ((q.type === 'single' || q.type === 'multi') && q.allowOther) {
    answerShape[otherKey(q.id)] = z
      .string()
      .trim()
      .max(FORUM_SURVEY_OTHER_MAX, `${FORUM_SURVEY_OTHER_MAX}자 이하로 입력해주세요`)
      .optional()
  }
}

const optionalName = (max: number, message: string) => z.string().trim().max(max, message).optional().or(z.literal(''))

export const forumSurveySchema = z.object({
  answers: z.object(answerShape),
  // 모두 선택 — 비워 두면 무기명 응답
  respondentName: optionalName(50, '이름은 50자 이하로 입력해주세요'),
  respondentOrg: optionalName(100, '소속은 100자 이하로 입력해주세요'),
  respondentContact: optionalName(100, '연락처는 100자 이하로 입력해주세요'),
})

export type ForumSurveyAnswerValue = string | number | string[] | undefined
export interface ForumSurveyInput {
  answers: Record<string, ForumSurveyAnswerValue>
  respondentName?: string
  respondentOrg?: string
  respondentContact?: string
}
