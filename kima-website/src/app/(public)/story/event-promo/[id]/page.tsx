import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { convertDriveUrl } from '@/lib/utils'
import { EventPromoGallery } from '@/components/story/EventPromoGallery'

const VideoEmbed = nextDynamic(
  () => import('@/components/story/VideoEmbed').then((m) => m.VideoEmbed),
  { loading: () => <div className="aspect-video bg-gray-100 animate-pulse rounded-xl" /> }
)
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const story = await prisma.story.findUnique({ where: { id }, select: { title: true } }).catch(() => null)
  return { title: story ? `${story.title} | KIMA 행사 홍보` : '행사 홍보 | KIMA' }
}

export default async function EventPromoDetailPage({ params }: Props) {
  const { id } = await params
  const [story, session] = await Promise.all([
    prisma.story.findUnique({
      where: { id, type: 'EVENT_PROMO', isPublished: true, status: 'APPROVED' },
      include: { author: { select: { name: true } } },
    }).catch(() => null),
    auth(),
  ])

  if (!story) notFound()

  const canEdit =
    session?.user?.id &&
    (story.authorId === session.user.id ||
      session.user.role === 'ADMIN' ||
      session.user.role === 'OFFICER')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/story/event-promo"
              className="inline-flex items-center gap-1 text-blue-300 text-sm hover:text-white transition-colors"
            >
              ← 목록으로
            </Link>
            {canEdit && (
              <Link
                href={`/story/event-promo/${id}/edit`}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
              >
                ✎ 수정하기
              </Link>
            )}
          </div>
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {story.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-rose-500/30 text-rose-200 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-2xl font-bold leading-snug">{story.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-200">
            {story.eventLocation && (
              <span>📍 {story.eventLocation}</span>
            )}
            <span>{story.authorName ?? story.author?.name ?? '작성자'}</span>
            <span>{story.createdAt.toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* 본문 */}
        {story.content && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {story.content}
            </div>
          </div>
        )}

        {/* 대표 이미지 + 갤러리 (라이트박스 포함) */}
        {(story.thumbnail || story.images.length > 0) && (
          <EventPromoGallery
            thumbnail={story.thumbnail ? convertDriveUrl(story.thumbnail) : null}
            images={story.images.map(convertDriveUrl)}
            title={story.title}
          />
        )}

        {/* 동영상 */}
        {story.videoUrls.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">관련 영상</h2>
            <div className="space-y-4">
              {story.videoUrls.map((url, i) => (
                <VideoEmbed key={i} url={url} title={`${story.title} 영상 ${i + 1}`} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* 웹사이트 링크 */}
        {story.linkUrl && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">🔗 관련 웹페이지</h2>
            <a
              href={story.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#142d54] transition-colors break-all"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {story.linkUrl}
            </a>
          </section>
        )}

        {/* 목록 버튼 */}
        <div className="pt-4 border-t border-gray-100">
          <Link
            href="/story/event-promo"
            className="inline-flex items-center gap-1 text-sm text-[#1B3A6B] font-medium hover:underline"
          >
            ← 행사 홍보 목록
          </Link>
        </div>
      </div>
    </div>
  )
}
