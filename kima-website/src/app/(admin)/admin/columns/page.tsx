import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { PublishToggle } from '@/components/admin/PublishToggle'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '칼럼 관리 | KIMA 관리자' }

export default async function AdminColumnsPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/')

  const columns = await prisma.columnPost.findMany({
    select: {
      id: true,
      title: true,
      isPublished: true,
      viewCount: true,
      createdAt: true,
      tags: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const publishedCount = columns.filter((c) => c.isPublished).length

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">이주민 사역 칼럼 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            전체 {columns.length}편 · 공개 {publishedCount}편 · 숨김 {columns.length - publishedCount}편
          </p>
        </div>
        <Link
          href="/story/columns"
          target="_blank"
          className="shrink-0 text-xs text-[#1B3A6B] underline hover:text-[#15305a]"
        >
          공개 페이지 보기 →
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {columns.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">등록된 칼럼이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-left">작성자</th>
                <th className="px-4 py-3 text-left">조회수</th>
                <th className="px-4 py-3 text-left">공개</th>
                <th className="px-4 py-3 text-left">등록일</th>
                <th className="px-4 py-3 text-left">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {columns.map((col) => (
                <tr key={col.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <Link
                      href={`/story/columns/${col.id}`}
                      target="_blank"
                      className="font-medium text-gray-900 hover:text-[#1B3A6B] hover:underline line-clamp-1"
                    >
                      {col.title}
                    </Link>
                    {col.tags.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {col.tags.map((t) => `#${t}`).join(' ')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {col.author.name ?? '익명'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {col.viewCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <PublishToggle
                      id={col.id}
                      isPublished={col.isPublished}
                      apiUrl={`/api/admin/columns/${col.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {col.createdAt.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/story/columns/${col.id}/edit`}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        수정
                      </Link>
                      <DeleteButton
                        url={`/api/admin/columns/${col.id}`}
                        confirmText="이 칼럼을 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
