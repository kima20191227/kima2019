import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'
import { AnswerSection } from '@/components/qna/AnswerSection'
import { QuestionDeleteButton } from '@/components/qna/QuestionDeleteButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const question = await prisma.question.findUnique({
    where: { id, isPublished: true },
    select: { title: true },
  })
  if (!question) return { title: 'Q&A | KIMA' }
  return { title: `${question.title} | KIMA Q&A` }
}

export default async function QnaDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const question = await prisma.question.findUnique({
    where: { id, isPublished: true },
    include: {
      author: { select: { id: true, name: true } },
      answers: {
        where: { isPublished: true },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!question) notFound()

  const role = session?.user?.role as UserRole | undefined
  const isAdmin = role === 'ADMIN'
  const canManageQuestion =
    isAdmin || (!!session?.user?.id && question.author.id === session.user.id)
  const isLoggedIn = !!session?.user

  // Serialize dates for client components
  const serializedAnswers = question.answers.map((a) => ({
    id: a.id,
    content: a.content,
    createdAt: a.createdAt.toISOString(),
    author: a.author,
  }))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Q&amp;A
          </p>
          <div className="flex items-start gap-3 mb-3">
            <span
              className={`flex-shrink-0 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                question.status === 'ANSWERED'
                  ? 'bg-green-400/20 text-green-200'
                  : 'bg-white/10 text-blue-200'
              }`}
            >
              {question.status === 'ANSWERED' ? '답변완료' : '답변대기'}
            </span>
            <h1 className="text-xl font-bold leading-snug">{question.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-blue-200">
            <span>{question.author.name ?? '익명'}</span>
            <span>·</span>
            <span>{new Date(question.createdAt).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* 질문 본문 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm">
            {question.content}
          </p>

          {/* 질문 수정·삭제 (작성자 또는 ADMIN) */}
          {canManageQuestion && (
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-3">
              <Link
                href={`/story/qna/${question.id}/edit`}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                수정
              </Link>
              <QuestionDeleteButton questionId={question.id} />
            </div>
          )}
        </div>

        {/* 답변 영역 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <AnswerSection
            questionId={question.id}
            answers={serializedAnswers}
            currentUserId={session?.user?.id}
            isAdmin={isAdmin}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* 목록으로 */}
        <div>
          <Link
            href="/story/qna"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}
