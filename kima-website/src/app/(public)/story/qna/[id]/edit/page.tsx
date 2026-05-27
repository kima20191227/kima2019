import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { QuestionWriteForm } from '@/components/qna/QuestionWriteForm'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '질문 수정 | KIMA Q&A',
}

export default async function QnaEditPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/story/qna/${id}/edit`)
  }

  const question = await prisma.question.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      authorId: true,
      attachments: true,
    },
  })

  if (!question) notFound()

  const role = session.user.role as UserRole
  if (role !== 'ADMIN' && question.authorId !== session.user.id) {
    redirect(`/story/qna/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Q&amp;A
          </p>
          <h1 className="text-2xl font-bold">질문 수정</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <QuestionWriteForm
            mode="edit"
            initialData={{
              id: question.id,
              title: question.title,
              content: question.content,
              attachments: Array.isArray(question.attachments)
                ? (question.attachments as { url: string; name: string; type: string; isCover?: boolean }[])
                : [],
            }}
          />
        </div>
      </div>
    </div>
  )
}
