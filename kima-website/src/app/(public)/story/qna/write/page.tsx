import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QuestionWriteForm } from '@/components/qna/QuestionWriteForm'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

export const metadata: Metadata = {
  title: '질문하기 | KIMA Q&A',
}

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

export default async function QnaWritePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/story/qna/write')
  }

  const role = session.user.role as UserRole
  if ((ROLE_WEIGHT[role] ?? 0) < 1) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Q&amp;A
          </p>
          <h1 className="text-2xl font-bold">질문하기</h1>
          <p className="mt-2 text-blue-200 text-sm">
            이주민 사역에 관한 질문을 남겨주세요.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <QuestionWriteForm mode="create" />
        </div>
      </div>
    </div>
  )
}
