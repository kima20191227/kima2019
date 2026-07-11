'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPasswordSchema, type ResetPasswordInput } from '@/schemas/auth.schema'
import { FieldError } from './FieldError'

const INPUT =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-900 bg-white'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) {
      setServerError(body.message || '재설정 중 오류가 발생했습니다')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-green-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.
        </div>
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium hover:opacity-90"
        >
          로그인하러 가기
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register('token')} />

      <div>
        <label className={LABEL}>새 비밀번호</label>
        <input type="password" {...register('password')} className={INPUT} placeholder="영문+숫자 8자 이상" />
        <FieldError message={errors.password?.message} />
      </div>

      <div>
        <label className={LABEL}>새 비밀번호 확인</label>
        <input type="password" {...register('passwordConfirm')} className={INPUT} placeholder="비밀번호 재입력" />
        <FieldError message={errors.passwordConfirm?.message} />
      </div>

      {serverError && (
        <div className="space-y-2">
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{serverError}</p>
          <Link href="/auth/forgot-password" className="block text-sm text-[#1B3A6B] hover:underline">
            다시 요청하기
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '재설정 중...' : '비밀번호 재설정'}
      </button>
    </form>
  )
}
