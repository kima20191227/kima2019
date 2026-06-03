import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { NoticeEditForm } from './NoticeEditForm'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: '공지사항 수정 | KIMA' }

export default async function NoticeEditPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const role = session.user.role
  if (role !== 'OFFICER' && role !== 'ADMIN') redirect('/story/notice')

  const { id } = await params
  const notice = await prisma.story.findUnique({
    where: { id, type: 'NOTICE' },
    select: { id: true, title: true, content: true, excerpt: true, tags: true },
  }).catch(() => null)

  if (!notice) notFound()

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-1">공지사항 수정</h1>
        <p className="text-sm text-gray-500 mb-8">공지 내용을 수정합니다.</p>
        <NoticeEditForm notice={notice} />
      </div>
    </div>
  )
}
