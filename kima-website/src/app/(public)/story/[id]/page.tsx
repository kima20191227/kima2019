import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { convertDriveUrl } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const TYPE_LABELS: Record<string, string> = {
  NEWS:           '📰 KIMA 뉴스',
  FIELD_STORY:    '✍️ 현장 이야기',
  EVENT_MEDIA:    '📸 행사 사진&영상',
  PRAYER_REQUEST: '🙏 중보기도',
}

const TYPE_BACK: Record<string, string> = {
  NEWS:           '/story/news',
  FIELD_STORY:    '/story/field',
  EVENT_MEDIA:    '/story/media',
  PRAYER_REQUEST: '/story/prayer',
}

const TYPE_EDIT: Record<string, string> = {
  EVENT_MEDIA: 'media',
  NOTICE:      'notice',
  EVENT_PROMO: 'event-promo',
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const story = await prisma.story.findUnique({ where: { id }, select: { title: true } })
  return { title: story ? `${story.title} | KIMA 현장스토리` : '현장스토리 | KIMA' }
}

export default async function StoryDetailPage({ params }: PageProps) {
  const { id } = await params

  const [story, session] = await Promise.all([
    prisma.story.findUnique({
      where: { id, isPublished: true },
      include: { author: { select: { name: true, organization: true } } },
    }),
    auth().catch(() => null),
  ])

  if (!story) notFound()

  const date    = story.createdAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  const backUrl = TYPE_BACK[story.type] ?? '/story/field'

  const displayName = story.authorName ?? story.author?.name ?? 'KIMA'
  const displayOrg  = story.ministryLocation ?? story.author?.organization

  const canEdit = session?.user?.role === 'ADMIN'
    || session?.user?.role === 'OFFICER'
    || session?.user?.id === story.authorId

  const editSlug = TYPE_EDIT[story.type]
  const editUrl  = editSlug ? `/story/${editSlug}/${id}/edit` : null

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B3A6B] mb-6 transition-colors"
        >
          ← 목록으로
        </Link>

        <article className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* 썸네일 */}
          {story.thumbnail && (
            <div className="relative w-full h-56">
              <Image src={convertDriveUrl(story.thumbnail)} alt={story.title} fill className="object-cover" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {TYPE_LABELS[story.type] ?? story.type}
              </span>
              <span className="text-xs text-gray-400">{date}</span>
            </div>

            <div className="flex items-start justify-between gap-3 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1">{story.title}</h1>
              {canEdit && editUrl && (
                <Link
                  href={editUrl}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  수정
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold shrink-0">
                {displayName[0]}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{displayName}</p>
                {displayOrg && <p className="text-xs text-gray-400">{displayOrg}</p>}
              </div>
            </div>

            {/* NEWS: 외부 링크 */}
            {story.type === 'NEWS' && story.linkUrl && (
              <a
                href={story.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#15305a] transition-colors"
              >
                기사 보기 →
              </a>
            )}

            {/* 본문 */}
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {story.content}
            </div>

            {/* 이미지 그리드 (EVENT_MEDIA) */}
            {story.images.length > 0 && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                {story.images.map((img, i) => (
                  <div key={i} className="relative w-full h-32">
                    <Image src={convertDriveUrl(img)} alt={`${story.title} ${i + 1}`} fill className="object-cover rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {/* 동영상 링크 */}
            {story.videoUrls.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {story.videoUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    ▶ 영상 보기 {story.videoUrls.length > 1 ? i + 1 : ''}
                  </a>
                ))}
              </div>
            )}

            {/* 태그 */}
            {story.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        <div className="mt-8 text-center">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-all text-sm"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
