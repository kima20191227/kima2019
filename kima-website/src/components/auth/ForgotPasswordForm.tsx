'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/schemas/auth.schema'
import { FieldError } from './FieldError'

const INPUT =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-900 bg-white'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState('')
  const [sentMessage, setSentMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) {
      setServerError(body.message || '요청 중 오류가 발생했습니다')
      return
    }
    setSentMessage(body.message)
  }

  if (sentMessage) {
    return (
      <div className="rounded-xl border border-green-200 bg-emerald-50 p-5 text-sm text-emerald-700">
        {sentMessage}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className={LABEL}>이메일</label>
        <input type="email" {...register('email')} className={INPUT} placeholder="example@email.com" />
        <FieldError message={errors.email?.message} />
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '발송 중...' : '재설정 링크 받기'}
      </button>
    </form>
  )
}
