'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import Link from 'next/link'
import { findIdSchema, type FindIdInput } from '@/schemas/auth.schema'
import { FieldError } from './FieldError'

const INPUT =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-900 bg-white'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

export function FindIdForm() {
  const [serverError, setServerError] = useState('')
  const [foundEmail, setFoundEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FindIdInput>({ resolver: zodResolver(findIdSchema) })

  const onSubmit = async (data: FindIdInput) => {
    setServerError('')
    setFoundEmail('')
    const res = await fetch('/api/auth/find-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) {
      setServerError(body.message || '조회 중 오류가 발생했습니다')
      return
    }
    setFoundEmail(body.email)
  }

  if (foundEmail) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-green-200 bg-emerald-50 p-5 text-center">
          <p className="text-sm text-gray-600 mb-1">회원님의 이메일</p>
          <p className="text-lg font-bold text-[#1B3A6B]">{foundEmail}</p>
        </div>
        <Link
          href="/auth/login"
          className="block w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium text-center hover:opacity-90"
        >
          로그인하기
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className={LABEL}>이름</label>
        <input type="text" {...register('name')} className={INPUT} placeholder="홍길동" />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className={LABEL}>
          전화번호 <span className="font-normal text-gray-400">(선택 · 동명이인일 때만)</span>
        </label>
        <input type="tel" {...register('phone')} className={INPUT} placeholder="010-0000-0000" />
        <FieldError message={errors.phone?.message} />
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '조회 중...' : '아이디 찾기'}
      </button>
    </form>
  )
}
