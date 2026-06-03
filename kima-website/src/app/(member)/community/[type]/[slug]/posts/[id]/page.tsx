import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { convertDriveUrl } from '@/lib/utils'
import type { Metadata } from 'next'
import type { CategoryType } from '@prisma/client'
import { PostAttachmentGallery } from '@/components/community/PostAttachmentGallery'

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

type Attachment = { url: string; name: string; type: string }

function getDriveFileId(url: string): string | null {
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/)
  if (m1) return m1[1]
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/)
  if (m2) return m2[1]
  return null
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

  const inlineUrls = new Set(
    [...(post.content?.matchAll(/\[img:[^\]]*\]\(([^)]+)\)/g) ?? [])].map((m) => m[1])
  )
  const allAttachments = Array.isArray(post.attachments)
    ? (post.attachments as Attachment[])
    : []
  const remainingAttachments = allAttachments.filter((att) => !inlineUrls.has(att.url))

  const imageAttachments = remainingAttachments
    .filter((att) => att.type?.startsWith('image/'))
    .map((att) => ({ url: convertDriveUrl(att.url), name: att.name }))

  const videoAttachments = remainingAttachments.filter((att) => att.type?.startsWith('video/'))
  const fileAttachments = remainingAttachments.filter(
    (att) => !att.type?.startsWith('image/') && !att.type?.startsWith('video/')
  )

  const contentText = post.content?.replace(/\[img:[^\]]*\]\([^)]+\)/g, '').trim() ?? ''
  const inlineImages = [...(post.content?.matchAll(/\[img:([^\]]*)\]\(([^)]+)\)/g) ?? [])].map((m) => ({
    name: m[1],
    url: convertDriveUrl(m[2]),
  }))
  const allImages = [...inlineImages, ...imageAttachments]

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 다크 블루 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/community/${type}/${slug}`}
              className="inline-flex items-center gap-1 text-blue-300 text-sm hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {post.category.name} 게시판으로
            </Link>
            {isAuthorOrAdmin && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/community/${type}/${slug}/posts/${post.id}/edit`}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  ✎ 수정하기
                </Link>
                <DeletePostButton
                  postId={post.id}
                  redirectTo={`/community/${type}/${slug}`}
                  className="px-3 py-1.5 bg-white/10 hover:bg-red-600/80 text-white/70 hover:text-white text-xs font-medium rounded-lg transition-colors"
                />
              </div>
            )}
          </div>

          {post.type === 'NOTICE' && (
            <span className="inline-block mb-3 px-2.5 py-1 rounded text-xs font-bold bg-white/20 text-white">
              공지
            </span>
          )}
          <h1 className="text-2xl font-bold leading-snug">{post.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-200">
            <span>{post.author.name ?? '알 수 없음'}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* 본문 텍스트 */}
        {contentText.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              <span className="whitespace-pre-wrap">{contentText}</span>
            </div>
          </div>
        )}

        {/* 이미지 갤러리 (인라인 이미지 + 첨부 이미지) */}
        {allImages.length > 0 && (
          <PostAttachmentGallery images={allImages} />
        )}

        {/* 영상 첨부파일 */}
        {videoAttachments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">
              첨부 영상 ({videoAttachments.length})
            </p>
            {videoAttachments.map((att, idx) => {
              const driveId = getDriveFileId(att.url)
              return (
                <div key={idx}>
                  <p className="text-xs text-gray-400 mb-2 truncate">{att.name}</p>
                  {driveId ? (
                    <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-100 bg-black">
                      <iframe
                        src={`https://drive.google.com/file/d/${driveId}/preview`}
                        className="w-full h-full"
                        allow="autoplay"
                        title={att.name}
                      />
                    </div>
                  ) : (
                    <video
                      controls
                      className="w-full rounded-lg border border-gray-100 bg-black"
                      preload="metadata"
                    >
                      <source src={att.url} type={att.type} />
                      <p className="text-sm text-gray-500 p-4">
                        브라우저에서 재생을 지원하지 않습니다.{' '}
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[#1B3A6B] underline">
                          직접 열기
                        </a>
                      </p>
                    </video>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 비이미지 첨부파일 */}
        {fileAttachments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-500 mb-3">
              첨부파일 ({fileAttachments.length})
            </p>
            <ul className="space-y-2">
              {fileAttachments.map((att, idx) => (
                <li key={idx}>
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
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 목록으로 */}
        <div className="pt-4 border-t border-gray-100">
          <Link
            href={`/community/${type}/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-[#1B3A6B] font-medium hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {post.category.name} 목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}

function DeletePostButton({
  postId,
  redirectTo,
  className,
}: {
  postId: string
  redirectTo: string
  className?: string
}) {
  return (
    <form
      action={async () => {
        'use server'
        const { auth: authFn } = await import('@/lib/auth')
        const { prisma: db } = await import('@/lib/prisma')
        const { redirect } = await import('next/navigation')
        const session = await authFn()
        if (!session?.user) return
        const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } })
        const ROLE_WEIGHT: Record<string, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }
        const rw = ROLE_WEIGHT[session.user.role] ?? 0
        if (post?.authorId !== session.user.id && rw < 4) return
        await db.post.delete({ where: { id: postId } })
        redirect(redirectTo)
      }}
    >
      <button
        type="submit"
        className={
          className ??
          'text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors'
        }
      >
        삭제
      </button>
    </form>
  )
}
