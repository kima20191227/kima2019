import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'
import { ColumnDeleteButton } from '@/components/column/ColumnDeleteButton'
import { sanitizeRichHtml } from '@/lib/sanitizeHtml'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const column = await prisma.columnPost.findUnique({
    where: { id, isPublished: true },
    select: { title: true, excerpt: true },
  })
  if (!column) return { title: '칼럼 | KIMA' }
  return {
    title: `${column.title} | KIMA 이주민 사역 칼럼`,
    description: column.excerpt ?? undefined,
  }
}

export default async function ColumnDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const [column] = await Promise.all([
    prisma.columnPost.findUnique({
      where: { id, isPublished: true },
      include: { author: { select: { id: true, name: true } } },
      // authorName is automatically included
    }),
    // Increment view count (force-dynamic prevents prefetch inflation)
    prisma.columnPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => null), // silently ignore if not found
  ])

  if (!column) notFound()

  const role = session?.user?.role as UserRole | undefined
  const canManage =
    role === 'ADMIN' || role === 'OFFICER' || (!!session?.user?.id && column.author.id === session.user.id)

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-3">
            <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase">
              Column
            </p>
            {canManage && (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/story/columns/${column.id}/edit`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-colors border border-white/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  수정
                </Link>
                <ColumnDeleteButton columnId={column.id} variant="dark" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-snug">{column.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-blue-200">
            <span>{column.authorName ?? column.author.name ?? '익명'}</span>
            <span>{new Date(column.createdAt).toLocaleDateString('ko-KR')}</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {column.viewCount + 1}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tags */}
        {column.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {column.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 text-gray-800
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-gray-900
            [&_p]:my-3 [&_p]:leading-relaxed [&_p]:text-gray-800
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
            [&_li]:my-1 [&_li]:text-gray-800
            [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4
            [&_strong]:font-semibold [&_strong]:text-gray-900
            [&_a]:text-blue-600 [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(column.content) }}
        />

        {/* Attachments */}
        {column.fileUrls.length > 0 && (
          <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">첨부파일</p>
            <ul className="space-y-1.5">
              {column.fileUrls.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    첨부파일 {i + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Back */}
        <div className="mt-8">
          <Link
            href="/story/columns"
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
