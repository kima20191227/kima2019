'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  forum2026RegisterSchema,
  FORUM_POSITIONS,
  type Forum2026RegisterInput,
} from '@/schemas/forum2026.schema'
import { REGIONS } from '@/schemas/member.schema'
import { MINISTRY_LANGUAGES } from '@/schemas/auth.schema'
import {
  FORUM_BANK,
  FORUM_CONTACT_EMAIL,
  FORUM_DAYS,
  FORUM_FEE_NOTE,
  FORUM_INFO,
  FORUM_LODGING_NIGHTS,
  FORUM_MEAL_DAYS,
  FORUM_PAYMENT_CONFIRM_TEXT,
  FORUM_PRIVACY_RETENTION,
  FORUM_REFUND_TEXT,
} from '@/lib/forum2026'
import { FieldError } from '@/components/auth/FieldError'

const INPUT =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-900 bg-white text-base'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'
const SECTION = 'bg-gray-50 rounded-xl p-5 space-y-4'
const SECTION_TITLE = 'text-sm font-semibold text-[#1B3A6B] mb-3 pb-1 border-b border-gray-200'
const CHOICE =
  'flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 cursor-pointer has-[:checked]:border-[#1B3A6B] has-[:checked]:bg-blue-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-gray-100 has-[:disabled]:text-gray-400'

const ACCOUNT_TEXT = `${FORUM_BANK.bank} ${FORUM_BANK.account}`
const HELPER = 'text-xs text-gray-500 -mt-0.5 mb-2'

// 사역 언어권 — 기본으로 앞의 9개(베트남어…영어)만 보이고 나머지는 '전체 보기'로 펼친다
const PRIMARY_LANGUAGE_COUNT = 9
const PRIMARY_LANGUAGES = MINISTRY_LANGUAGES.slice(0, PRIMARY_LANGUAGE_COUNT)
const EXTRA_LANGUAGES = MINISTRY_LANGUAGES.slice(PRIMARY_LANGUAGE_COUNT)

// 카카오톡 인앱 브라우저 등 clipboard API 미지원 환경 대비 fallback
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fallback으로 진행
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

function SuccessView({ depositorName }: { depositorName: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const handleCopy = async () => {
    const ok = await copyText(FORUM_BANK.account)
    setCopyState(ok ? 'copied' : 'failed')
  }

  return (
    <div className="space-y-6 text-center">
      <div>
        <p className="text-4xl mb-3">✅</p>
        <h2 className="text-2xl font-bold text-[#1B3A6B]">신청 완료</h2>
        <p className="mt-2 text-gray-600 text-sm leading-relaxed">
          {FORUM_INFO.title} 참가 신청이 접수되었습니다.<br />
          아래 계좌로 참가비({FORUM_INFO.feeText})를 입금해 주시면 신청이 확정됩니다.
        </p>
      </div>

      <div className="bg-[#1B3A6B] rounded-2xl p-6 text-white shadow-lg">
        <p className="text-blue-200 text-sm mb-1">참가비 입금 계좌</p>
        <p className="text-lg font-semibold">{FORUM_BANK.bank}</p>
        <p className="text-2xl font-bold tracking-wider text-[#C8922A] my-2 break-all">{FORUM_BANK.account}</p>
        <p className="text-blue-200 text-sm">예금주: {FORUM_BANK.holder}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 px-5 py-2.5 rounded-lg bg-[#C8922A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {copyState === 'copied' ? '복사되었습니다' : '계좌번호 복사'}
        </button>
        {copyState === 'failed' && (
          <p className="mt-2 text-xs text-blue-100">복사에 실패했습니다. 계좌번호를 길게 눌러 복사해 주세요.</p>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        입금자명은 <strong>{depositorName}</strong>(으)로 입금해 주세요.<br />
        입금자명이 다르면 확인이 늦어질 수 있습니다.
      </div>

      <ul className="text-left text-sm text-gray-700 space-y-1 list-disc pl-5 leading-relaxed">
        <li>참가비: {FORUM_FEE_NOTE}</li>
        <li>{FORUM_PAYMENT_CONFIRM_TEXT}되면 신청이 확정됩니다.</li>
        <li>환불: {FORUM_REFUND_TEXT}</li>
        <li>
          문의·수정·취소:{' '}
          <a href={`mailto:${FORUM_CONTACT_EMAIL}`} className="text-[#1B3A6B] underline break-all">{FORUM_CONTACT_EMAIL}</a>
        </li>
      </ul>

      <Link
        href="/"
        className="inline-block w-full py-3 rounded-lg border border-[#1B3A6B] text-[#1B3A6B] font-semibold hover:bg-blue-50 transition-colors"
      >
        홈으로
      </Link>
    </div>
  )
}

interface ForumRegisterFormProps {
  defaultName?: string
  defaultEmail?: string
  /** 신청 마감 표시 문구 (서버에서 포맷해 전달 — 하이드레이션 불일치 방지) */
  deadlineText?: string
}

export function ForumRegisterForm({ defaultName = '', defaultEmail = '', deadlineText }: ForumRegisterFormProps) {
  const [serverError, setServerError] = useState('')
  const [completedDepositor, setCompletedDepositor] = useState<string | null>(null)
  const [showAllLanguages, setShowAllLanguages] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Forum2026RegisterInput>({
    resolver: zodResolver(forum2026RegisterSchema),
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      ministryLanguages: [],
      attendDays: [],
      lodgingDays: [],
      mealDays: [],
      privacyAgreed: false,
    },
  })

  const onSubmit = async (data: Forum2026RegisterInput) => {
    setServerError('')
    try {
      const res = await fetch('/api/forum2026/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setServerError(body.message || '신청 중 오류가 발생했습니다')
        return
      }
      setCompletedDepositor(data.depositorName)
      window.scrollTo?.({ top: 0, behavior: 'smooth' })
    } catch {
      setServerError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  // 숨겨질 언어가 이미 선택돼 있으면 접지 않는다 (선택이 화면에서 사라지지 않도록)
  const selectedLanguages = watch('ministryLanguages') ?? []
  const hasHiddenSelection = EXTRA_LANGUAGES.some((lang) => selectedLanguages.includes(lang))
  const languagesExpanded = showAllLanguages || hasHiddenSelection
  const visibleLanguages = languagesExpanded ? MINISTRY_LANGUAGES : PRIMARY_LANGUAGES

  // 숙박·식사는 참석하는 날만 선택 가능 — 참석을 해제하면 그날의 숙박·식사 선택도 지운다
  const attendDays = watch('attendDays') ?? []
  const dropUnattendedStay = () => {
    const attending = getValues('attendDays') ?? []
    const keep = (list: string[] | undefined) => (list ?? []).filter((v) => attending.includes(v))
    setValue('lodgingDays', keep(getValues('lodgingDays')))
    setValue('mealDays', keep(getValues('mealDays')))
  }

  if (completedDepositor !== null) {
    return <SuccessView depositorName={completedDepositor} />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* 신청자 정보 */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>신청자 정보</p>

        <div>
          <label htmlFor="forum-name" className={LABEL}>이름 *</label>
          <input id="forum-name" type="text" {...register('name')} className={INPUT} placeholder="홍길동" autoComplete="name" />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="forum-phone" className={LABEL}>휴대폰 *</label>
          <input id="forum-phone" type="tel" inputMode="tel" {...register('phone')} className={INPUT} placeholder="010-0000-0000" autoComplete="tel" />
          <FieldError message={errors.phone?.message} />
        </div>

        <div>
          <label htmlFor="forum-email" className={LABEL}>이메일 *</label>
          <input id="forum-email" type="email" inputMode="email" {...register('email')} className={INPUT} placeholder="example@email.com" autoComplete="email" />
          <p className="mt-1 text-xs text-gray-400">신청 확인 메일이 발송됩니다.</p>
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <label htmlFor="forum-organization" className={LABEL}>소속 단체/교회 *</label>
          <input id="forum-organization" type="text" {...register('organization')} className={INPUT} placeholder="소속 단체명 또는 교회명" />
          <FieldError message={errors.organization?.message} />
        </div>

        <div>
          <label htmlFor="forum-position" className={LABEL}>
            직분 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <select id="forum-position" {...register('position')} className={INPUT}>
            <option value="">직분 선택</option>
            {FORUM_POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <FieldError message={errors.position?.message} />
        </div>
      </div>

      {/* 사역 정보 */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>사역 정보 (선택)</p>

        <div>
          <label htmlFor="forum-region" className={LABEL}>사역 지역</label>
          <select id="forum-region" {...register('region')} className={INPUT}>
            <option value="">지역 선택</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <FieldError message={errors.region?.message} />
        </div>

        <fieldset>
          <legend className={LABEL}>사역 언어권 (복수 선택)</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {visibleLanguages.map((lang) => (
              <label key={lang} className={CHOICE}>
                <input type="checkbox" value={lang} {...register('ministryLanguages')} className="accent-[#1B3A6B]" />
                <span className="break-keep">{lang}</span>
              </label>
            ))}
          </div>
          {!languagesExpanded ? (
            <button
              type="button"
              onClick={() => setShowAllLanguages(true)}
              aria-expanded={false}
              className="mt-2 text-sm font-medium text-[#1B3A6B] underline underline-offset-2"
            >
              전체 보기 (+{EXTRA_LANGUAGES.length})
            </button>
          ) : (
            !hasHiddenSelection && (
              <button
                type="button"
                onClick={() => setShowAllLanguages(false)}
                aria-expanded={true}
                className="mt-2 text-sm font-medium text-[#1B3A6B] underline underline-offset-2"
              >
                접기
              </button>
            )
          )}
          <FieldError message={errors.ministryLanguages?.message} />
        </fieldset>
      </div>

      {/* 참석 정보 */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>참석 정보</p>

        <fieldset>
          <legend className={LABEL}>참석 일정 * (1개 이상)</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FORUM_DAYS.map((day) => (
              <label key={day.value} className={CHOICE}>
                <input
                  type="checkbox"
                  value={day.value}
                  {...register('attendDays', { onChange: dropUnattendedStay })}
                  className="accent-[#1B3A6B]"
                />
                {day.label}
              </label>
            ))}
          </div>
          <FieldError message={errors.attendDays?.message} />
        </fieldset>

        <fieldset>
          <legend className={LABEL}>숙박</legend>
          <p className={HELPER}>
            {attendDays.length
              ? '숙박할 날짜를 선택하세요 (해당 없으면 선택하지 않음)'
              : '참석 일정을 먼저 선택하세요'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FORUM_LODGING_NIGHTS.map((night) => (
              <label key={night.value} className={CHOICE}>
                <input
                  type="checkbox"
                  value={night.value}
                  disabled={!attendDays.includes(night.value)}
                  {...register('lodgingDays')}
                  className="accent-[#1B3A6B]"
                />
                {night.label}
              </label>
            ))}
          </div>
          <FieldError message={errors.lodgingDays?.message} />
        </fieldset>

        <fieldset>
          <legend className={LABEL}>식사</legend>
          <p className={HELPER}>
            {attendDays.length
              ? '식사할 날짜를 선택하세요 (해당 없으면 선택하지 않음)'
              : '참석 일정을 먼저 선택하세요'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FORUM_MEAL_DAYS.map((day) => (
              <label key={day.value} className={CHOICE}>
                <input
                  type="checkbox"
                  value={day.value}
                  disabled={!attendDays.includes(day.value)}
                  {...register('mealDays')}
                  className="accent-[#1B3A6B]"
                />
                {day.label}
              </label>
            ))}
          </div>
          <FieldError message={errors.mealDays?.message} />
        </fieldset>
      </div>

      {/* 참가비 입금 */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>참가비 입금 ({FORUM_INFO.feeText})</p>

        <div className="rounded-lg bg-white border border-gray-200 p-4 text-sm text-gray-700">
          <p className="font-semibold text-[#1B3A6B]">{ACCOUNT_TEXT}</p>
          <p className="text-gray-500 mt-0.5">예금주: {FORUM_BANK.holder}</p>
          <p className="text-xs text-gray-500 mt-2">{FORUM_FEE_NOTE} · {FORUM_PAYMENT_CONFIRM_TEXT}</p>
        </div>

        <div>
          <label htmlFor="forum-depositor" className={LABEL}>입금자명 *</label>
          <input id="forum-depositor" type="text" {...register('depositorName')} className={INPUT} placeholder="입금 시 표시될 이름" />
          <FieldError message={errors.depositorName?.message} />
        </div>

        <div>
          <label htmlFor="forum-deposit-date" className={LABEL}>
            입금 예정일 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <input id="forum-deposit-date" type="date" {...register('depositDate')} className={INPUT} />
          <FieldError message={errors.depositDate?.message} />
        </div>
      </div>

      {/* 기타 */}
      <div className={SECTION}>
        <p className={SECTION_TITLE}>기타</p>
        <div>
          <label htmlFor="forum-requests" className={LABEL}>
            기타 요청사항 <span className="text-gray-400 font-normal">(선택, 500자 이내)</span>
          </label>
          <textarea id="forum-requests" rows={4} {...register('requests')} className={INPUT} placeholder="식이 제한, 동행 인원, 교통 문의 등" />
          <FieldError message={errors.requests?.message} />
        </div>
      </div>

      {/* 개인정보 동의 */}
      <div className="rounded-xl border border-gray-200 p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-800">개인정보 수집·이용 동의</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc pl-4 leading-relaxed">
          <li>수집 항목: 이름, 휴대폰, 이메일, 소속, 직분, 사역 정보, 참석·숙박·식사 일정, 입금자명</li>
          <li>이용 목적: {FORUM_INFO.title} 참가 신청 접수, 참가비 입금 확인, 행사 안내 연락</li>
          <li>보유 기간: {FORUM_PRIVACY_RETENTION}</li>
          <li>
            동의를 거부할 수 있으나, 거부 시 참가 신청이 불가합니다.{' '}
            <Link href="/privacy" target="_blank" className="text-[#1B3A6B] underline">개인정보처리방침</Link>
          </li>
        </ul>
        <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
          <input type="checkbox" {...register('privacyAgreed')} className="w-4 h-4 accent-[#1B3A6B]" />
          개인정보 수집·이용에 동의합니다 *
        </label>
        <FieldError message={errors.privacyAgreed?.message} />
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{serverError}</p>
      )}

      {/* 제출 직전 요약 */}
      <dl aria-label="신청 요약" className="rounded-xl border border-[#1B3A6B]/20 bg-blue-50/60 p-4 space-y-1.5 text-sm">
        <div className="flex gap-3">
          <dt className="w-16 flex-shrink-0 text-gray-500">참가비</dt>
          <dd className="text-gray-900">
            <span className="font-semibold">{FORUM_INFO.feeText}</span>
            <span className="block text-xs text-gray-500">{FORUM_FEE_NOTE}</span>
          </dd>
        </div>
        {deadlineText && (
          <div className="flex gap-3">
            <dt className="w-16 flex-shrink-0 text-gray-500">신청 마감</dt>
            <dd className="font-semibold text-gray-900">{deadlineText}</dd>
          </div>
        )}
        <div className="flex gap-3">
          <dt className="w-16 flex-shrink-0 text-gray-500">입금 계좌</dt>
          <dd className="font-semibold text-gray-900 break-all">
            {ACCOUNT_TEXT}
            <span className="block text-xs font-normal text-gray-500">예금주: {FORUM_BANK.holder}</span>
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 flex-shrink-0 text-gray-500">환불</dt>
          <dd className="text-gray-900">{FORUM_REFUND_TEXT}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 flex-shrink-0 text-gray-500">문의</dt>
          <dd className="text-gray-900 break-all">
            <a href={`mailto:${FORUM_CONTACT_EMAIL}`} className="text-[#1B3A6B] underline">{FORUM_CONTACT_EMAIL}</a>
          </dd>
        </div>
      </dl>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-[#1B3A6B] text-white rounded-lg font-semibold text-base hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isSubmitting ? '신청 처리 중...' : '참가 신청하기'}
      </button>
    </form>
  )
}
