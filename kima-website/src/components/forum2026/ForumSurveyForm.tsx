'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forumSurveySchema, type ForumSurveyInput } from '@/schemas/forumSurvey.schema'
import {
  FORUM_SURVEY_OTHER,
  FORUM_SURVEY_SECTIONS,
  FORUM_SURVEY_TEXT_MAX,
  RATING_LABELS,
  getChoiceOptions,
  otherKey,
  type ForumSurveyQuestion,
} from '@/lib/forumSurvey'
import { FieldError } from '@/components/auth/FieldError'

const INPUT =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-900 bg-white text-base'
const SECTION = 'bg-gray-50 rounded-xl p-5 space-y-6'
const SECTION_TITLE = 'text-sm font-semibold text-[#1B3A6B] pb-1 border-b border-gray-200'
const CHOICE =
  'flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 cursor-pointer has-[:checked]:border-[#1B3A6B] has-[:checked]:bg-blue-50'
const SCORE =
  'flex items-center justify-center h-11 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 cursor-pointer has-[:checked]:border-[#1B3A6B] has-[:checked]:bg-[#1B3A6B] has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#C8922A]'

interface ForumSurveyFormProps {
  /** 미리보기(관리자) — 화면은 같지만 제출은 막는다 */
  previewOnly?: boolean
}

export function ForumSurveyForm({ previewOnly = false }: ForumSurveyFormProps) {
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForumSurveyInput>({
    resolver: zodResolver(forumSurveySchema) as unknown as Resolver<ForumSurveyInput>,
    defaultValues: { answers: {}, respondentName: '', respondentOrg: '', respondentContact: '' },
  })

  const answers = watch('answers') ?? {}
  const answerError = (id: string) => {
    const e = (errors.answers as Record<string, { message?: string }> | undefined)?.[id]
    return e?.message
  }
  const setAnswer = (id: string, value: string | number | string[] | undefined) =>
    setValue(`answers.${id}`, value, { shouldValidate: true, shouldDirty: true })

  const onSubmit = async (data: ForumSurveyInput) => {
    setServerError('')
    if (previewOnly) {
      setServerError('미리보기에서는 제출되지 않습니다.')
      return
    }
    try {
      const res = await fetch('/api/forum2026/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setServerError(body.message || '제출 중 오류가 발생했습니다')
        return
      }
      setDone(true)
      window.scrollTo?.({ top: 0, behavior: 'smooth' })
    } catch {
      setServerError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-4xl" aria-hidden="true">🙏</p>
        <h3 className="text-xl font-bold text-[#1B3A6B]">소중한 의견 감사합니다</h3>
        <p className="text-sm text-gray-600 leading-relaxed break-keep">
          보내 주신 의견은 내년 포럼을 준비하는 데 귀하게 쓰겠습니다.
        </p>
        <Link
          href="/"
          className="inline-block w-full py-3 rounded-lg border border-[#1B3A6B] text-[#1B3A6B] font-semibold hover:bg-blue-50 transition-colors"
        >
          홈으로
        </Link>
      </div>
    )
  }

  const renderQuestion = (q: ForumSurveyQuestion, index: number) => {
    const labelId = `q-${q.id}`
    const error = answerError(q.id)
    const value = answers[q.id]

    return (
      <fieldset key={q.id} aria-describedby={error ? `${labelId}-error` : undefined} className="space-y-2 min-w-0">
        <legend id={labelId} className="text-sm font-medium text-gray-800 break-keep">
          {q.label}
          {q.required && <span className="text-red-500 ml-1" aria-label="필수">*</span>}
        </legend>
        {q.help && <p className="text-xs text-gray-500">{q.help}</p>}

        {q.type === 'rating' && (
          <>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className={SCORE}>
                  <input
                    type="radio"
                    name={`rating-${q.id}`}
                    className="sr-only"
                    checked={value === n}
                    onChange={() => setAnswer(q.id, n)}
                    aria-label={`${n}점 ${RATING_LABELS[n - 1]}`}
                  />
                  {n}
                </label>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{RATING_LABELS[0]}</span>
              <span>{RATING_LABELS[4]}</span>
            </div>
          </>
        )}

        {q.type === 'nps' && (
          <>
            <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
              {Array.from({ length: 11 }, (_, n) => (
                <label key={n} className={SCORE}>
                  <input
                    type="radio"
                    name={`nps-${q.id}`}
                    className="sr-only"
                    checked={value === n}
                    onChange={() => setAnswer(q.id, n)}
                    aria-label={`${n}점`}
                  />
                  {n}
                </label>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>전혀 추천하지 않음</span>
              <span>적극 추천</span>
            </div>
          </>
        )}

        {q.type === 'single' && (
          <div className="space-y-2">
            {getChoiceOptions(q).map((opt) => (
              <label key={opt} className={CHOICE}>
                <input
                  type="radio"
                  name={`single-${q.id}`}
                  checked={value === opt}
                  onChange={() => setAnswer(q.id, opt)}
                  className="h-4 w-4 accent-[#1B3A6B]"
                />
                {opt === FORUM_SURVEY_OTHER ? '기타 (직접 입력)' : opt}
              </label>
            ))}
          </div>
        )}

        {q.type === 'multi' && (
          <div className="space-y-2">
            {getChoiceOptions(q).map((opt) => {
              const selected = Array.isArray(value) ? value : []
              return (
                <label key={opt} className={CHOICE}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={(e) =>
                      setAnswer(q.id, e.target.checked ? [...selected, opt] : selected.filter((v) => v !== opt))
                    }
                    className="h-4 w-4 accent-[#1B3A6B]"
                  />
                  {opt === FORUM_SURVEY_OTHER ? '기타 (직접 입력)' : opt}
                </label>
              )
            })}
          </div>
        )}

        {(q.type === 'single' || q.type === 'multi') && q.allowOther && (
          (q.type === 'single' ? value === FORUM_SURVEY_OTHER : Array.isArray(value) && value.includes(FORUM_SURVEY_OTHER)) && (
            <input
              type="text"
              maxLength={200}
              aria-label={`${q.label} — 기타 내용`}
              placeholder="내용을 입력해 주세요"
              className={INPUT}
              {...register(`answers.${otherKey(q.id)}`)}
            />
          )
        )}

        {q.type === 'text' && (
          <textarea
            rows={4}
            maxLength={FORUM_SURVEY_TEXT_MAX}
            aria-labelledby={labelId}
            className={INPUT}
            placeholder={q.placeholder ?? '자유롭게 적어 주세요'}
            {...register(`answers.${q.id}`)}
          />
        )}

        <div id={`${labelId}-error`}>
          <FieldError message={error} />
        </div>
        {/* 스크린리더용: 문항 번호 */}
        <span className="sr-only">{`문항 ${index + 1}`}</span>
      </fieldset>
    )
  }

  let counter = 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {previewOnly && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
          관리자 미리보기입니다. 화면 확인용이며 제출되지 않습니다.
        </p>
      )}

      {FORUM_SURVEY_SECTIONS.map((section) => (
        <section key={section.id} className={SECTION}>
          <div>
            <h3 className={SECTION_TITLE}>{section.title}</h3>
            {section.description && <p className="mt-2 text-xs text-gray-500 break-keep">{section.description}</p>}
          </div>
          {section.questions.map((q) => renderQuestion(q, counter++))}
        </section>
      ))}

      <section className={SECTION}>
        <div>
          <h3 className={SECTION_TITLE}>7. 응답자 정보 (선택)</h3>
          <p className="mt-2 text-xs text-gray-500 break-keep">
            모두 비워 두시면 무기명으로 제출됩니다. 입력하신 정보는 설문 분석과 후속 안내에만 사용하며,
            응답은 관리자만 볼 수 있습니다.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="respondentName" className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input id="respondentName" type="text" autoComplete="name" className={INPUT} {...register('respondentName')} />
            <FieldError message={errors.respondentName?.message} />
          </div>
          <div>
            <label htmlFor="respondentOrg" className="block text-sm font-medium text-gray-700 mb-1">소속 단체·교회</label>
            <input id="respondentOrg" type="text" autoComplete="organization" className={INPUT} {...register('respondentOrg')} />
            <FieldError message={errors.respondentOrg?.message} />
          </div>
        </div>
        <div>
          <label htmlFor="respondentContact" className="block text-sm font-medium text-gray-700 mb-1">
            연락처 (이메일 또는 휴대폰)
          </label>
          <input id="respondentContact" type="text" className={INPUT} placeholder="후속 연락을 원하시는 경우에만" {...register('respondentContact')} />
          <FieldError message={errors.respondentContact?.message} />
        </div>
      </section>

      {serverError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 rounded-lg bg-[#1B3A6B] text-white font-semibold hover:bg-[#142d54] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '제출 중...' : '설문 제출하기'}
      </button>
    </form>
  )
}
