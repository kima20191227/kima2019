import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Q&A 게시판 | KIMA 현장스토리',
  description: '이주민 사역에 관한 질문과 답변을 나눕니다.',
}

export default async function QnaPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const questions = await prisma.question.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      author: { select: { name: true } },
      _count: { select: { answers: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Q&amp;A
          </p>
          <h1 className="text-2xl font-bold">Q&amp;A 게시판</h1>
          <p className="mt-2 text-blue-200 text-sm">
            이주민 사역에 관한 질문과 답변을 나눕니다.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 질문 작성 버튼 (로그인 사용자) */}
        {isLoggedIn && (
          <div className="mb-6 flex justify-end">
            <Link
              href="/story/qna/write"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              질문하기
            </Link>
          </div>
        )}

        {/* 질문 목록 */}
        {questions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <p className="text-lg">아직 등록된 질문이 없습니다.</p>
            {isLoggedIn && (
              <p className="text-sm mt-2 text-gray-400">첫 번째 질문을 남겨보세요.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {questions.map((q) => (
              <Link key={q.id} href={`/story/qna/${q.id}`}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  {/* 답변 상태 배지 */}
                  <span
                    className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      q.status === 'ANSWERED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {q.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                  </span>

                  {/* 제목 + 메타 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{q.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {q.author.name ?? '익명'} ·{' '}
                      {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  {/* 답변 수 */}
                  {q._count.answers > 0 && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      {q._count.answers}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 비로그인 안내 */}
        {!isLoggedIn && (
          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
            <Link href="/auth/login" className="font-medium underline">
              로그인
            </Link>
            하시면 질문을 작성하고 답변을 받을 수 있습니다.
          </div>
        )}
      </div>
    </div>
  )
}
