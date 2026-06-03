import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const notice = await prisma.story.findUnique({ where: { id } }).catch(() => null)
  return { title: notice ? `${notice.title} | KIMA 공지사항` : '공지사항 | KIMA' }
}

export default async function NoticeDetailPage({ params }: Props) {
  const { id } = await params
  const [notice, session] = await Promise.all([
    prisma.story.findUnique({
      where: { id, type: 'NOTICE', isPublished: true, status: 'APPROVED' },
      include: { author: { select: { name: true } } },
    }).catch(() => null),
    auth().catch(() => null),
  ])

  if (!notice) notFound()

  const canEdit = session?.user?.role === 'OFFICER' || session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/story/notice"
            className="inline-flex items-center gap-1 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            공지사항 목록
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Notice</p>
              {notice.tags.includes('중요') && (
                <span className="inline-block mb-2 px-2 py-0.5 bg-red-500/80 text-white text-xs font-semibold rounded">
                  중요
                </span>
              )}
              <h1 className="text-xl font-bold leading-snug">{notice.title}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-blue-200 flex-wrap">
                <span>{notice.author?.name ?? '관리자'}</span>
                <span>{notice.createdAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            {canEdit && (
              <Link
                href={`/story/notice/${notice.id}/edit`}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors border border-white/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 md:p-8">
          {notice.excerpt && (
            <p className="text-sm text-gray-500 leading-relaxed mb-6 pb-6 border-b border-gray-100">
              {notice.excerpt}
            </p>
          )}
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
            {notice.content}
          </div>
          {notice.tags.filter((t) => t !== '중요').length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-6 pt-6 border-t border-gray-100">
              {notice.tags.filter((t) => t !== '중요').map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/story/notice"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B3A6B] transition-colors"
          >
            ← 공지사항 목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}
