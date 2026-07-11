import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata = { title: '비밀번호 찾기 | KIMA' }

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-[#1B3A6B]">KIMA</Link>
          <p className="text-gray-500 mt-1 text-sm">한국이주민선교연합회</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">비밀번호 찾기</h1>
          <p className="text-sm text-gray-500 mb-6">
            가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다.
          </p>

          <ForgotPasswordForm />

          <div className="mt-6 text-sm">
            <Link href="/auth/find-id" className="text-gray-500 hover:text-[#1B3A6B] hover:underline">
              아이디를 잊으셨나요? 아이디 찾기
            </Link>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            <Link href="/auth/login" className="text-[#1B3A6B] font-medium hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
