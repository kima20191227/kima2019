import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: '로그인 | KIMA' }

interface Props {
  searchParams: Promise<{ notice?: string; registered?: string; error?: string }>
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: '소셜 로그인이 현재 설정 중입니다. 이메일 로그인을 이용해 주세요.',
  AccessDenied: '로그인이 거부되었습니다.',
  OAuthAccountNotLinked: '이미 다른 방법으로 가입된 이메일입니다. 이메일 로그인을 이용해 주세요.',
  NotRegistered: '아직 가입되지 않은 구글 계정입니다. 먼저 회원가입을 완료해 주세요.',
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const isPremiumNotice = params.notice === 'premium'
  const isRegistered = params.registered === '1'
  const isNotRegistered = params.error === 'NotRegistered'
  const oauthError = params.error
    ? OAUTH_ERROR_MESSAGES[params.error] ??
      '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    : null

  return (
    <main className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1B3A6B]">KIMA</Link>
          <p className="text-gray-500 mt-1 text-sm">한국이주민선교연합회</p>
        </div>

        {/* 정회원 전용 안내 배너 */}
        {isPremiumNotice && (
          <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-amber-800 text-sm">정회원만 볼 수 있는 자료방입니다.</p>
              <p className="text-amber-700 text-xs mt-0.5">
                로그인 후 정회원 신청을 통해 사역자료에 접근하실 수 있습니다.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">로그인</h1>

          {isRegistered && (
            <div className="mb-5 rounded-xl border border-green-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              가입이 완료되었습니다. 입력하신 이메일과 비밀번호로 로그인해 주세요.
            </div>
          )}

          {oauthError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{oauthError}</p>
              {isNotRegistered && (
                <Link
                  href="/auth/register"
                  className="mt-3 block w-full rounded-lg bg-[#1B3A6B] py-2.5 text-center font-medium text-white hover:opacity-90"
                >
                  회원가입 하러 가기
                </Link>
              )}
            </div>
          )}

          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="text-center text-sm text-gray-500 mt-6">
            계정이 없으신가요?{' '}
            <Link href="/auth/register" className="text-[#1B3A6B] font-medium hover:underline">
              회원가입
            </Link>
          </p>
        </div>

        {isPremiumNotice && (
          <p className="text-center text-xs text-gray-400 mt-4">
            이미 정회원이신가요? 로그인 후 자동으로 이동됩니다.
          </p>
        )}
      </div>
    </main>
  )
}
