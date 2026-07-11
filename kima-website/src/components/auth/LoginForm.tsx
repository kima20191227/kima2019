'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'
import { FieldError } from './FieldError'

function getSafeCallbackUrl(value: string | null): string {
  if (!value) return '/'

  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin) return '/'
    return `${url.pathname}${url.search}${url.hash}` || '/'
  } catch {
    return '/'
  }
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setServerError('')
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl,
    })

    if (!result || result.error || result.ok === false) {
      setServerError('이메일 또는 비밀번호가 올바르지 않습니다')
      return
    }

    // 전체 페이지 이동으로 서버 렌더 헤더가 로그인 상태로 갱신되도록 함
    // (router.push는 클라이언트 이동이라 공유 레이아웃 헤더가 갱신되지 않음)
    window.location.assign(callbackUrl)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input
          type="email"
          {...register('email')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-900 bg-white"
          placeholder="example@email.com"
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
        <input
          type="password"
          {...register('password')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-900 bg-white"
          placeholder="8자 이상"
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex justify-end gap-3 text-xs text-gray-500">
        <Link href="/auth/find-id" className="hover:text-[#1B3A6B] hover:underline">아이디 찾기</Link>
        <span className="text-gray-300">|</span>
        <Link href="/auth/forgot-password" className="hover:text-[#1B3A6B] hover:underline">비밀번호 찾기</Link>
      </div>

      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '로그인 중...' : '로그인'}
      </button>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">또는</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full py-3 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.85Z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.01c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.99 11.99 0 0 0 12 24Z" />
          <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
        </svg>
        구글 계정으로 로그인
      </button>

    </form>
  )
}
