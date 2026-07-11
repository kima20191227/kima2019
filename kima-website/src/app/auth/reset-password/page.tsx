import { Suspense } from 'react'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = { title: '비밀번호 재설정 | KIMA' }

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams
  const token = params.token

  return (
    <main className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1B3A6B]">KIMA</Link>
          <p className="text-gray-500 mt-1 text-sm">한국이주민선교연합회</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-6">비밀번호 재설정</h1>

          {token ? (
            <Suspense>
              <ResetPasswordForm token={token} />
            </Suspense>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                잘못된 접근입니다. 비밀번호 재설정 링크를 다시 요청해 주세요.
              </div>
              <Link
                href="/auth/forgot-password"
                className="block w-full py-3 bg-[#1B3A6B] text-white rounded-lg font-medium text-center hover:opacity-90"
              >
                비밀번호 찾기로 이동
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
