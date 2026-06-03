import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { convertDriveUrl } from '@/lib/utils'
import { MemberWriteButton } from '@/components/story/MemberWriteButton'
import type { Metadata } from 'next'

export const revalidate = 1800

export const metadata: Metadata = { title: '이주민 사역안내 | KIMA' }

export default async function EventPromoPage() {
  const stories = await prisma.story.findMany({
    where: { type: 'EVENT_PROMO', isPublished: true, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true } } },
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Ministry Guide</p>
            <h1 className="text-2xl font-bold">이주민 사역안내</h1>
            <p className="mt-2 text-blue-200 text-sm">이주민 사역 관련 행사를 소개하고 알립니다. 회원이라면 누구나 등록할 수 있습니다.</p>
          </div>
          <MemberWriteButton href="/story/event-promo/write" label="사역홍보&amp;행사등록하기" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {stories.length === 0 ? (
          <p className="text-center text-gray-400 py-20">등록된 사역안내가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {stories.map((story) => (
              <Link key={story.id} href={`/story/event-promo/${story.id}`}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {(story.thumbnail || story.images[0]) && (
                      <div className="md:w-52 md:h-40 w-full h-48 shrink-0 bg-gray-50 overflow-hidden relative">
                        <Image
                          src={convertDriveUrl(story.thumbnail || story.images[0])}
                          alt={story.title}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col justify-between">
                      <div>
                        {story.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {story.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="font-semibold text-gray-800 text-base line-clamp-2">{story.title}</h3>
                        {story.excerpt && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{story.excerpt}</p>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        {story.eventLocation && (
                          <span className="flex items-center gap-1">
                            <span>📍</span>
                            {story.eventLocation}
                          </span>
                        )}
                        <span>{story.authorName ?? story.author?.name ?? '작성자'}</span>
                        <span className="ml-auto">{story.createdAt.toLocaleDateString('ko-KR')}</span>
                        {story.images.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <span>🖼</span> {story.images.length}
                          </span>
                        )}
                        {story.videoUrls.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            <span>▶</span> {story.videoUrls.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
