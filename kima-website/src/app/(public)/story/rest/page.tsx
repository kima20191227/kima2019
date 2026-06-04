import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MemberWriteButton } from '@/components/story/MemberWriteButton'
import type { Metadata } from 'next'

export const revalidate = 1800

export const metadata: Metadata = {
  title: '쉬어가는 발걸음 | KIMA 현장스토리',
  description: '사역의 길 위에서 잠시 멈춰 쉬어가는 이야기들을 나눕니다.',
}

export default async function RestWalkPage() {
  const stories = await prisma.story.findMany({
    where: { type: 'REST_WALK', isPublished: true, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      excerpt: true,
      tags: true,
      authorName: true,
      ministryLocation: true,
      createdAt: true,
    },
  }).catch(() => [])

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Rest &amp; Walk
          </p>
          <h1 className="text-2xl font-bold">쉬어가는 발걸음</h1>
          <p className="mt-2 text-blue-200 text-sm">
            사역의 길 위에서 잠시 멈춰 쉬어가는 이야기들을 나눕니다.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 작성 버튼 */}
        <div className="mb-6 flex justify-end">
          <MemberWriteButton
            href="/story/rest/write"
            label="글 올리기"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors"
          />
        </div>

        {/* 목록 */}
        {stories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <p className="text-3xl mb-3">🌿</p>
            <p className="text-lg">아직 등록된 글이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">첫 번째 이야기를 나눠보세요.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {stories.map((story) => {
              const displayAuthor = story.authorName ?? '익명'
              return (
                <Link
                  key={story.id}
                  href={`/story/${story.id}`}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">{story.title}</h2>
                      {story.excerpt && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{story.excerpt}</p>
                      )}
                      {story.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {story.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span className="font-medium text-gray-600">{displayAuthor}</span>
                        {story.ministryLocation && <span>{story.ministryLocation}</span>}
                        <span>{new Date(story.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <svg
                      className="flex-shrink-0 w-4 h-4 text-gray-300 self-center"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
