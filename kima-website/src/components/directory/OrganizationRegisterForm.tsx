'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { organizationSchema, ORG_REGIONS, ORG_TYPES, LANGUAGES, TARGETS, type OrganizationInput } from '@/schemas/organization.schema'
import { FieldError } from '@/components/auth/FieldError'
import { Button } from '@/components/ui/Button'

function CheckboxGroup({
  label,
  required,
  options,
  selected,
  onToggle,
  error,
}: {
  label: string
  required?: boolean
  options: readonly string[]
  selected: string[]
  onToggle: (val: string) => void
  error?: string
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-3.5 h-3.5 accent-[#1B3A6B]"
            />
            <span className={`text-sm ${selected.includes(opt) ? 'font-semibold text-[#1B3A6B]' : 'text-gray-700'}`}>
              {opt}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function RadioGroup({
  label,
  required,
  options,
  value,
  onChange,
  withNone,
  error,
}: {
  label: string
  required?: boolean
  options: readonly string[]
  value: string | undefined
  onChange: (val: string | undefined) => void
  withNone?: boolean
  error?: string
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
        {withNone && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              checked={!value}
              onChange={() => onChange(undefined)}
              className="w-3.5 h-3.5 accent-[#1B3A6B]"
            />
            <span className={`text-sm ${!value ? 'font-semibold text-[#1B3A6B]' : 'text-gray-400'}`}>선택 안 함</span>
          </label>
        )}
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="w-3.5 h-3.5 accent-[#1B3A6B]"
            />
            <span className={`text-sm ${value === opt ? 'font-semibold text-[#1B3A6B]' : 'text-gray-700'}`}>
              {opt}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function OrganizationRegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedTargets, setSelectedTargets] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { languages: [], targets: [] },
  })

  const selectedRegion = watch('region')
  const selectedType = watch('type')

  const toggleMulti = (
    key: 'languages' | 'targets',
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
  ) => {
    const next = current.includes(val) ? current.filter((v) => v !== val) : [...current, val]
    setter(next)
    setValue(key, next, { shouldValidate: true })
  }

  const onSubmit = async (data: OrganizationInput) => {
    setServerError(null)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        setServerError(body.error ?? '등록 중 오류가 발생했습니다.')
        return
      }
      setSubmitted(true)
    } catch {
      setServerError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#1B3A6B] mb-2">등록이 완료되었습니다</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          단체가 사역지도 디렉토리에 바로 등재되었습니다.
        </p>
        <Button onClick={() => router.push('/directory')}>디렉토리로 돌아가기</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 단체명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          단체명 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          placeholder="예: 서울이주민선교회"
        />
        <FieldError message={errors.name?.message} />
      </div>

      {/* 대표/담임목사 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">대표 / 담임목사 (선택)</label>
        <input
          {...register('representative')}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          placeholder="예: 홍길동 목사"
        />
        <FieldError message={errors.representative?.message} />
      </div>

      {/* 영문 단체명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">영문 단체명 (선택)</label>
        <input
          {...register('nameEn')}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          placeholder="Seoul Multicultural Mission"
        />
        <FieldError message={errors.nameEn?.message} />
      </div>

      {/* 지역 — 라디오 */}
      <RadioGroup
        label="지역"
        required
        options={ORG_REGIONS}
        value={selectedRegion}
        onChange={(v) => setValue('region', v as any, { shouldValidate: true })}
        error={errors.region?.message}
      />

      {/* 사역유형 — 라디오 (선택) */}
      <RadioGroup
        label="사역유형 (선택)"
        options={ORG_TYPES}
        value={selectedType}
        onChange={(v) => setValue('type', v as any, { shouldValidate: true })}
        withNone
      />

      {/* 주요 언어권 — 체크박스 */}
      <CheckboxGroup
        label="주요 언어권"
        required
        options={LANGUAGES}
        selected={selectedLanguages}
        onToggle={(val) => toggleMulti('languages', selectedLanguages, setSelectedLanguages, val)}
        error={errors.languages?.message}
      />

      {/* 사역대상 — 체크박스 */}
      <CheckboxGroup
        label="사역대상"
        required
        options={TARGETS}
        selected={selectedTargets}
        onToggle={(val) => toggleMulti('targets', selectedTargets, setSelectedTargets, val)}
        error={errors.targets?.message}
      />

      {/* 단체 소개 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">단체 소개 (선택)</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none"
          placeholder="단체의 사역 내용과 비전을 간략히 소개해 주세요 (500자 이내)"
        />
        <FieldError message={errors.description?.message} />
      </div>

      {/* 주소 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">주소 (선택)</label>
        <input
          {...register('address')}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          placeholder="서울특별시 영등포구..."
        />
      </div>

      {/* 전화 / 이메일 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전화번호 (선택)</label>
          <input
            {...register('phone')}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            placeholder="02-000-0000"
          />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이메일 (선택)</label>
          <input
            {...register('email')}
            type="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            placeholder="example@kima.org"
          />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      {/* 웹사이트 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">웹사이트 (선택)</label>
        <input
          {...register('website')}
          type="url"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          placeholder="https://example.org"
        />
        <FieldError message={errors.website?.message} />
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <p className="text-xs text-gray-400">
        * 등록 즉시 사역지도 디렉토리에 공개됩니다. 허위 정보 등록 시 삭제될 수 있습니다.
      </p>

      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        {isSubmitting ? '신청 중...' : '등록 신청하기'}
      </Button>
    </form>
  )
}
