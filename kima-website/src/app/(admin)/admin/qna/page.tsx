import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AdminQnaList } from '@/components/admin/AdminQnaList'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Q&A 관리 | KIMA 관리자' }

export default async function AdminQnaPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/')

  const questions = await prisma.question.findMany({
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      isPublished: true,
      createdAt: true,
      author: { select: { name: true } },
      answers: {
        where: { isPublished: true },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalAnswers = questions.reduce((sum, q) => sum + q.answers.length, 0)
  const pendingCount = questions.filter((q) => q.status === 'PENDING').length

  // Serialize dates for client component
  const serialized = questions.map((q) => ({
    ...q,
    createdAt: q.createdAt.toISOString(),
    answers: q.answers.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B3A6B]">Q&amp;A 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          전체 {questions.length}개 · 답변대기 {pendingCount}개 · 전체 답변 {totalAnswers}개
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">전체 질문</p>
          <p className="text-2xl font-bold text-gray-800">{questions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">답변 대기</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">전체 답변</p>
          <p className="text-2xl font-bold text-blue-600">{totalAnswers}</p>
        </div>
      </div>

      <AdminQnaList questions={serialized} />

      <p className="mt-4 text-xs text-gray-400">
        * 답변 칸의 숫자를 클릭하면 해당 질문의 답변 목록이 펼쳐집니다.
      </p>
    </div>
  )
}
