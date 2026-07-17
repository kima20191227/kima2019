import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ColumnWriteForm } from '@/components/column/ColumnWriteForm'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '칼럼 수정 | KIMA',
}

export default async function ColumnEditPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/story/columns/${id}/edit`)
  }

  const column = await prisma.columnPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      thumbnail: true,
      imageUrls: true,
      fileUrls: true,
      attachments: true,
      tags: true,
      authorId: true,
    },
  })

  if (!column) notFound()

  const role = session.user.role as UserRole
  if (role !== 'ADMIN' && role !== 'OFFICER' && column.authorId !== session.user.id) {
    redirect('/story/columns')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Column
          </p>
          <h1 className="text-2xl font-bold">이주민 사역 칼럼 수정</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <ColumnWriteForm
            mode="edit"
            initialData={{
              id: column.id,
              title: column.title,
              content: column.content,
              excerpt: column.excerpt,
              thumbnail: column.thumbnail,
              imageUrls: column.imageUrls,
              fileUrls: column.fileUrls,
              attachments: (column.attachments as unknown as { url: string; name: string; type: string }[] | null) ?? undefined,
              tags: column.tags,
            }}
          />
        </div>
      </div>
    </div>
  )
}
