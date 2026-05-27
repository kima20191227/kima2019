import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '이주민 사역 칼럼 | KIMA 현장스토리',
  description: '이주민 사역 현장에서 온 칼럼을 읽어보세요.',
}

export default async function ColumnsPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  const columns = await prisma.columnPost.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      excerpt: true,
      thumbnail: true,
      tags: true,
      viewCount: true,
      createdAt: true,
      authorName: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Column
          </p>
          <h1 className="text-2xl font-bold">이주민 사역 칼럼</h1>
          <p className="mt-2 text-blue-200 text-sm">
            이주민 사역 현장에서 온 칼럼을 읽어보세요.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 작성 버튼 (로그인 사용자) */}
        {isLoggedIn && (
          <div className="mb-6 flex justify-end">
            <Link
              href="/story/columns/write"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              칼럼 작성
            </Link>
          </div>
        )}

        {/* 칼럼 목록 — 리스트 형식 */}
        {columns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <p className="text-lg">아직 등록된 칼럼이 없습니다.</p>
            {isLoggedIn && (
              <p className="text-sm mt-2 text-gray-400">첫 번째 칼럼을 작성해보세요.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {columns.map((col) => {
              const displayAuthor = col.authorName ?? col.author.name ?? '익명'
              return (
                <Link key={col.id} href={`/story/columns/${col.id}`} className="block hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* 썸네일 (있을 때만) */}
                    {col.thumbnail && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={col.thumbnail}
                          alt={col.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 본문 */}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">{col.title}</h2>
                      {col.excerpt && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{col.excerpt}</p>
                      )}

                      {/* 태그 */}
                      {col.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {col.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 메타 */}
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                        <span className="font-medium text-gray-600">{displayAuthor}</span>
                        <span>{new Date(col.createdAt).toLocaleDateString('ko-KR')}</span>
                        <span className="flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {col.viewCount}
                        </span>
                      </div>
                    </div>

                    {/* 화살표 */}
                    <svg className="flex-shrink-0 w-4 h-4 text-gray-300 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
