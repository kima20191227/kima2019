import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { MediaGallery } from '@/components/story/MediaGallery'
import nextDynamic from 'next/dynamic'
import type { Metadata } from 'next'

const VideoEmbed = nextDynamic(
  () => import('@/components/story/VideoEmbed').then((m) => m.VideoEmbed),
  { loading: () => <div className="aspect-video bg-gray-100 animate-pulse rounded-xl" /> }
)

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await prisma.story.findUnique({ where: { id } }).catch(() => null)
  return { title: event ? `${event.title} | KIMA` : '행사 갤러리 | KIMA' }
}

export default async function MediaDetailPage({ params }: Props) {
  const { id } = await params
  const event = await prisma.story.findUnique({ where: { id, type: 'EVENT_MEDIA', isPublished: true } }).catch(() => null)

  if (!event) notFound()

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/story/media"
            className="inline-flex items-center gap-1 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            행사 갤러리 목록
          </Link>
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Gallery</p>
          <h1 className="text-xl font-bold leading-snug">{event.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-blue-200 flex-wrap">
            {event.publishedAt && (
              <span>{event.publishedAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
            {event.eventLocation && <span>📍 {event.eventLocation}</span>}
            {event.images.length > 0 && <span>📷 {event.images.length}장</span>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* 설명 */}
        {(event.content || event.excerpt) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {event.content || event.excerpt}
            </p>
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {event.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 사진 갤러리 */}
        {event.images.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[#1B3A6B] mb-3">
              행사 사진 <span className="text-sm font-normal text-gray-400">({event.images.length}장)</span>
            </h2>
            <MediaGallery images={event.images} title={event.title} />
          </section>
        )}

        {/* 영상 */}
        {event.videoUrls.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-[#1B3A6B] mb-4">행사 영상</h2>
            <div className="space-y-6">
              {event.videoUrls.map((url, i) => (
                <div key={i}>
                  {event.videoUrls.length > 1 && (
                    <p className="text-xs text-gray-400 mb-2">영상 {i + 1}</p>
                  )}
                  <VideoEmbed url={url} title={`${event.title} 영상 ${i + 1}`} index={i} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 사진도 영상도 없을 때 */}
        {event.images.length === 0 && event.videoUrls.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">📂</p>
            <p>사진·영상 자료를 준비 중입니다.</p>
          </div>
        )}

        {/* 목록으로 */}
        <div className="pt-4">
          <Link
            href="/story/media"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B3A6B] transition-colors"
          >
            ← 갤러리 목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}
