import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '공지사항 | KIMA' }

export default async function NoticePage() {
  const [session, notices] = await Promise.all([
    auth().catch(() => null),
    prisma.story.findMany({
      where: { type: 'NOTICE', isPublished: true, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    }).catch(() => []),
  ])

  const isOfficer = session?.user?.role === 'OFFICER' || session?.user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Notice</p>
            <h1 className="text-2xl font-bold">공지사항</h1>
            <p className="mt-2 text-blue-200 text-sm">KIMA의 주요 공지 및 안내사항을 전합니다.</p>
          </div>
          {isOfficer && (
            <Link
              href="/story/notice/write"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8922A] hover:bg-[#b07d20] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              공지 작성
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {notices.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 w-12 hidden sm:table-cell">번호</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">제목</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 w-24 hidden md:table-cell">작성자</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 w-28">날짜</th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice, idx) => (
                  <tr
                    key={notice.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-400 hidden sm:table-cell">
                      {notices.length - idx}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/story/notice/${notice.id}`}
                        className="text-sm font-medium text-gray-800 hover:text-[#1B3A6B] transition-colors line-clamp-1"
                      >
                        {notice.tags.includes('중요') && (
                          <span className="inline-block mr-2 px-1.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded">
                            중요
                          </span>
                        )}
                        {notice.title}
                      </Link>
                      {notice.excerpt && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{notice.excerpt}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell">
                      {notice.author?.name ?? '관리자'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {notice.createdAt.toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
