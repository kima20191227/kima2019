import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NoticeWriteForm } from './NoticeWriteForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '공지사항 작성 | KIMA' }

export default async function NoticeWritePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login?callbackUrl=/story/notice/write')

  const role = session.user.role
  if (role !== 'OFFICER' && role !== 'ADMIN') redirect('/story/notice')

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-1">공지사항 작성</h1>
        <p className="text-sm text-gray-500 mb-8">작성 즉시 공개됩니다.</p>
        <NoticeWriteForm />
      </div>
    </div>
  )
}
