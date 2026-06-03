import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { MediaDeleteButton } from '@/components/story/MediaDeleteButton'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '행사 사진&영상 | KIMA' }

export default async function MediaPage() {
  const [session, events] = await Promise.all([
    auth().catch(() => null),
    prisma.story.findMany({
      where: { type: 'EVENT_MEDIA', isPublished: true, status: 'APPROVED' },
      orderBy: { publishedAt: 'desc' },
    }).catch(() => []),
  ])

  const isOfficer = session?.user?.role === 'OFFICER' || session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Gallery</p>
            <h1 className="text-2xl font-bold">KIMA 행사 사진&amp;영상</h1>
            <p className="mt-2 text-blue-200 text-sm">KIMA가 주관·참여한 행사들의 사진과 영상을 모아봅니다.</p>
          </div>
          {isOfficer && (
            <Link
              href="/story/media/write"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8922A] hover:bg-[#b07d20] text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              사진·영상 등록
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {events.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-4xl mb-3">📷</p>
            <p>등록된 갤러리가 없습니다.</p>
            {isOfficer && (
              <Link
                href="/story/media/write"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#1B3A6B] font-medium hover:underline"
              >
                + 첫 번째 갤러리 등록하기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const cover = event.images[0] ?? null
              const extraCount = event.images.length - 1
              return (
                <div key={event.id} className="group relative">
                  <Link
                    href={`/story/media/${event.id}`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-[#C8922A] transition-all"
                  >
                    {/* 커버 이미지 */}
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {cover ? (
                        <>
                          <Image
                            src={cover}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {event.images.length > 1 && (
                            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              +{extraCount}장
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                          📷
                        </div>
                      )}
                      {event.videoUrls.length > 0 && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                          ▶ 영상
                        </span>
                      )}
                    </div>

                    {/* 텍스트 정보 */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 text-sm group-hover:text-[#1B3A6B] transition-colors line-clamp-2 mb-1">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        {event.publishedAt && (
                          <span>{event.publishedAt.toLocaleDateString('ko-KR')}</span>
                        )}
                        {event.eventLocation && (
                          <span>📍 {event.eventLocation}</span>
                        )}
                      </div>
                      {event.excerpt && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{event.excerpt}</p>
                      )}
                      {event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-xs text-[#1B3A6B] font-medium group-hover:gap-2 transition-all">
                        <span>사진 보기</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>

                  {/* OFFICER/ADMIN 수정·삭제 버튼 */}
                  {isOfficer && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/story/media/${event.id}/edit`}
                        className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[#1B3A6B] text-xs font-medium rounded-md shadow-sm border border-gray-200 hover:bg-[#1B3A6B] hover:text-white transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        수정
                      </Link>
                      <MediaDeleteButton id={event.id} title={event.title} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
