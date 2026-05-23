import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import type { CategoryType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const URL_TO_DB: Record<string, CategoryType> = {
  region: 'REGION',
  language: 'LANGUAGE',
  target: 'TARGET',
}

interface Props {
  params: Promise<{ type: string; slug: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { title: true } })
  if (!post) return { title: '게시글 | KIMA' }
  return { title: `${post.title} | KIMA 커뮤니티` }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PostDetailPage({ params }: Props) {
  const { type, slug, id } = await params
  const dbType = URL_TO_DB[type]
  if (!dbType) notFound()

  const [post, session] = await Promise.all([
    prisma.post.findUnique({
      where: { id, isPublished: true },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true, type: true } },
      },
    }),
    auth(),
  ])

  if (!post || post.category.slug !== slug || post.category.type !== dbType) notFound()

  const ROLE_WEIGHT: Record<string, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }
  const roleWeight = session?.user?.role ? (ROLE_WEIGHT[session.user.role] ?? 1) : 0
  const isAuthorOrAdmin = session?.user?.id === post.authorId || roleWeight >= 4

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link
          href={`/community/${type}/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B3A6B] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {post.category.name} 게시판으로
        </Link>

        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* 헤더 */}
          <div className="px-8 py-6 border-b border-gray-50">
            {post.type === 'NOTICE' && (
              <span className="inline-block mb-3 px-2.5 py-1 rounded text-xs font-bold bg-[#1B3A6B] text-white">
                공지
              </span>
            )}
            <h1 className="text-xl font-bold text-[#1A1A1A] leading-snug">{post.title}</h1>
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
              <span>{post.author.name ?? '알 수 없음'}</span>
              <span>·</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>

          {/* 본문 */}
          <div className="px-8 py-6">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* 첨부파일 */}
          {Array.isArray(post.attachments) && post.attachments.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-50">
              <p className="text-xs font-semibold text-gray-500 mb-3">첨부파일 ({post.attachments.length})</p>
              <ul className="space-y-2">
                {(post.attachments as { url: string; name: string; type: string }[]).map((att, idx) => {
                  const isImage = att.type?.startsWith('image/')
                  return (
                    <li key={idx}>
                      {isImage ? (
                        <div className="mb-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.url}
                            alt={att.name}
                            className="max-w-full rounded-lg border border-gray-100 max-h-96 object-contain"
                          />
                          <p className="text-xs text-gray-400 mt-1">{att.name}</p>
                        </div>
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-[#1B3A6B]/5 border border-gray-100 rounded-lg text-sm text-[#1B3A6B] transition-colors"
                        >
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="truncate max-w-xs">{att.name}</span>
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* 하단 액션 */}
          {isAuthorOrAdmin && (
            <div className="px-8 py-4 border-t border-gray-50 flex justify-end gap-2">
              <Link
                href={`/community/${type}/${slug}/posts/${post.id}/edit`}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#1B3A6B]/30 text-[#1B3A6B] hover:bg-[#1B3A6B]/5 transition-colors"
              >
                수정
              </Link>
              <DeletePostButton postId={post.id} redirectTo={`/community/${type}/${slug}`} />
            </div>
          )}
        </article>

      </div>
    </div>
  )
}

function DeletePostButton({ postId, redirectTo }: { postId: string; redirectTo: string }) {
  return (
    <form action={async () => {
      'use server'
      const { auth: authFn } = await import('@/lib/auth')
      const { prisma: db } = await import('@/lib/prisma')
      const { redirect } = await import('next/navigation')
      const session = await authFn()
      if (!session?.user) return
      const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } })
      const ROLE_WEIGHT: Record<string, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }
      const roleWeight = ROLE_WEIGHT[session.user.role] ?? 0
      if (post?.authorId !== session.user.id && roleWeight < 4) return
      await db.post.delete({ where: { id: postId } })
      redirect(redirectTo)
    }}>
      <button
        type="submit"
        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
      >
        삭제
      </button>
    </form>
  )
}
