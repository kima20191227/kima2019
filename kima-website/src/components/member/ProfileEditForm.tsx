'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldError } from '@/components/auth/FieldError'
import { POSITIONS } from '@/schemas/auth.schema'
import { REGIONS, updateProfileSchema, type UpdateProfileInput } from '@/schemas/member.schema'

interface ProfileEditFormProps {
  user: {
    email: string
    name: string | null
    position: string | null
    phone: string | null
    denomination: string | null
    organization: string | null
    address: string | null
    region: string | null
    ministryLanguages: string[]
    ministryTargets: string[]
  }
}

const INPUT =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#1B3A6B] focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 disabled:bg-gray-50 disabled:text-gray-400'
const LABEL = 'mb-1 block text-xs font-medium text-gray-600'

function toCsv(values: string[]) {
  return values.join(', ')
}

function toArray(text: string) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeInitial(user: ProfileEditFormProps['user']): UpdateProfileInput {
  return {
    name: user.name ?? '',
    position: (user.position ?? '') as UpdateProfileInput['position'],
    phone: user.phone ?? '',
    denomination: user.denomination ?? '',
    organization: user.organization ?? '',
    address: user.address ?? '',
    region: (user.region ?? '') as UpdateProfileInput['region'],
    ministryLanguages: user.ministryLanguages ?? [],
    ministryTargets: user.ministryTargets ?? [],
  }
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [saved, setSaved] = useState(false)
  const [languagesText, setLanguagesText] = useState(toCsv(user.ministryLanguages ?? []))
  const [targetsText, setTargetsText] = useState(toCsv(user.ministryTargets ?? []))

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: normalizeInitial(user),
  })

  const handleLanguagesChange = (text: string) => {
    setLanguagesText(text)
    setValue('ministryLanguages', toArray(text), { shouldDirty: true, shouldValidate: true })
  }

  const handleTargetsChange = (text: string) => {
    setTargetsText(text)
    setValue('ministryTargets', toArray(text), { shouldDirty: true, shouldValidate: true })
  }

  const closeForm = () => {
    const initial = normalizeInitial(user)
    reset(initial)
    setLanguagesText(toCsv(user.ministryLanguages ?? []))
    setTargetsText(toCsv(user.ministryTargets ?? []))
    setServerError('')
    setOpen(false)
  }

  const onSubmit = async (data: UpdateProfileInput) => {
    setServerError('')
    setSaved(false)

    const res = await fetch('/api/member/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      setServerError(body.error ?? '저장에 실패했습니다')
      return
    }

    setSaved(true)
    setOpen(false)
    reset(data)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-800">회원 정보</h3>
          <p className="mt-1 text-xs text-gray-400">{user.email}</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setSaved(false); setServerError('') }}
            className="shrink-0 rounded-lg border border-[#1B3A6B] px-4 py-2 text-sm font-medium text-[#1B3A6B] transition-colors hover:bg-[#1B3A6B] hover:text-white"
          >
            정보 수정
          </button>
        )}
      </div>

      {saved && (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          회원 정보가 저장되었습니다.
        </p>
      )}

      {!open ? (
        <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-400">이름</dt>
            <dd className="mt-0.5 font-medium text-gray-800">{user.name ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">직분</dt>
            <dd className="mt-0.5 font-medium text-gray-800">{user.position ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">전화번호</dt>
            <dd className="mt-0.5 font-medium text-gray-800">{user.phone ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">지역</dt>
            <dd className="mt-0.5 font-medium text-gray-800">{user.region ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">소속 교단</dt>
            <dd className="mt-0.5 font-medium text-gray-800">{user.denomination ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">소속 단체</dt>
            <dd className="mt-0.5 font-medium text-gray-800">{user.organization ?? '-'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-400">주소</dt>
            <dd className="mt-0.5 font-medium text-gray-800">{user.address ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">사역 언어</dt>
            <dd className="mt-0.5 font-medium text-gray-800">
              {user.ministryLanguages.length > 0 ? user.ministryLanguages.join(', ') : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">사역 대상</dt>
            <dd className="mt-0.5 font-medium text-gray-800">
              {user.ministryTargets.length > 0 ? user.ministryTargets.join(', ') : '-'}
            </dd>
          </div>
        </dl>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>이름 *</label>
              <input type="text" {...register('name')} className={INPUT} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <label className={LABEL}>이메일</label>
              <input type="email" value={user.email} className={INPUT} disabled readOnly />
            </div>
            <div>
              <label className={LABEL}>직분</label>
              <select {...register('position')} className={INPUT}>
                <option value="">선택 안 함</option>
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
              <FieldError message={errors.position?.message} />
            </div>
            <div>
              <label className={LABEL}>전화번호 *</label>
              <input type="tel" {...register('phone')} className={INPUT} placeholder="010-0000-0000" />
              <FieldError message={errors.phone?.message} />
            </div>
            <div>
              <label className={LABEL}>소속 교단</label>
              <input type="text" {...register('denomination')} className={INPUT} />
              <FieldError message={errors.denomination?.message} />
            </div>
            <div>
              <label className={LABEL}>소속 단체</label>
              <input type="text" {...register('organization')} className={INPUT} />
              <FieldError message={errors.organization?.message} />
            </div>
            <div>
              <label className={LABEL}>지역</label>
              <select {...register('region')} className={INPUT}>
                <option value="">선택 안 함</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
              <FieldError message={errors.region?.message} />
            </div>
            <div>
              <label className={LABEL}>주소</label>
              <input type="text" {...register('address')} className={INPUT} />
              <FieldError message={errors.address?.message} />
            </div>
          </div>

          <div>
            <label className={LABEL}>사역 언어 *</label>
            <input
              type="text"
              value={languagesText}
              onChange={(e) => handleLanguagesChange(e.target.value)}
              className={INPUT}
              placeholder="베트남어, 네팔어"
            />
            <FieldError message={errors.ministryLanguages?.message} />
          </div>

          <div>
            <label className={LABEL}>사역 대상 *</label>
            <input
              type="text"
              value={targetsText}
              onChange={(e) => handleTargetsChange(e.target.value)}
              className={INPUT}
              placeholder="이주노동자, 유학생"
            />
            <FieldError message={errors.ministryTargets?.message} />
          </div>

          {serverError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {serverError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-[#1B3A6B] py-2 text-sm font-medium text-white transition-colors hover:bg-[#15305a] disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '저장하기'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
