import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ColumnWriteForm } from '@/components/column/ColumnWriteForm'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

export const metadata: Metadata = {
  title: '칼럼 작성 | KIMA',
}

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

export default async function ColumnWritePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/story/columns/write')
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
            Column
          </p>
          <h1 className="text-2xl font-bold">이주민 사역 칼럼 작성</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <ColumnWriteForm mode="create" />
        </div>
      </div>
    </div>
  )
}
