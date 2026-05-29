import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { NewsSettingsForm } from '@/components/admin/NewsSettingsForm'
import { NewsSourceManager } from '@/components/admin/NewsSourceManager'
import { NewsCategoryManager } from '@/components/admin/NewsCategoryManager'
import { ensureDefaultNewsCategories, getAllNewsCategories } from '@/lib/newsCategories'
import { getNewsCategoryMeta } from '@/lib/newsCategoryConfig'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '뉴스 관리 | KIMA 관리자' }

type Tab = 'settings' | 'list' | 'sources' | 'categories'

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/')

  await ensureDefaultNewsCategories()

  const { tab: rawTab, page: rawPage } = await searchParams
  const tab: Tab =
    rawTab === 'list' || rawTab === 'sources' || rawTab === 'categories'
      ? rawTab
      : 'settings'

  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const PAGE_SIZE = 20
  const skip = (page - 1) * PAGE_SIZE

  const categories = await getAllNewsCategories()

  const [newsTotal, newsItems, sourceCount, categoryCount] = await Promise.all([
    tab === 'list' ? prisma.news.count() : Promise.resolve(0),
    tab === 'list'
      ? prisma.news.findMany({
          orderBy: { publishedAt: 'desc' },
          skip,
          take: PAGE_SIZE,
          select: {
            id: true,
            title: true,
            sourceName: true,
            category: true,
            publishedAt: true,
            isVisible: true,
            relevanceScore: true,
          },
        })
      : Promise.resolve([]),
    prisma.newsSource.count(),
    prisma.newsCategoryConfig.count(),
  ])

  const sources =
    tab === 'sources'
      ? await prisma.newsSource.findMany({ orderBy: { order: 'asc' } })
      : []

  const totalPages = Math.ceil(newsTotal / PAGE_SIZE)

  function tabUrl(nextTab: Tab) {
    return `/admin/news?tab=${nextTab}`
  }

  function pageUrl(nextPage: number) {
    return `/admin/news?tab=list&page=${nextPage}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">이주민·다문화 뉴스 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            자동 수집 설정, 뉴스 목록, 수집 소스, 분류 카테고리를 관리합니다.
          </p>
        </div>
        <Link
          href="/data/news"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#1B3A6B] hover:underline flex items-center gap-1"
        >
          공개 페이지 보기 →
        </Link>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {(
          [
            { key: 'settings' as Tab, label: '수집 설정' },
            { key: 'list' as Tab, label: `뉴스 목록 (${tab === 'list' ? newsTotal.toLocaleString() : '...'})` },
            { key: 'sources' as Tab, label: `소스 관리 (${sourceCount})` },
            { key: 'categories' as Tab, label: `분류 관리 (${categoryCount})` },
          ] as const
        ).map(({ key, label }) => (
          <Link
            key={key}
            href={tabUrl(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === key
                ? 'border-[#1B3A6B] text-[#1B3A6B]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === 'settings' && <NewsSettingsForm />}

      {tab === 'list' && (
        <div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-16">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">제목</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">카테고리</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-24">출처</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-20 hidden sm:table-cell">관련도</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-28 hidden md:table-cell">발행일</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {newsItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      수집된 뉴스가 없습니다.
                    </td>
                  </tr>
                ) : (
                  newsItems.map((item) => {
                    const meta = getNewsCategoryMeta(categories, item.category)
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`w-2 h-2 rounded-full inline-block ${item.isVisible ? 'bg-green-400' : 'bg-gray-300'}`} />
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-medium text-gray-800 truncate">{item.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.colorClass}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[96px]">
                          {item.sourceName}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                          {item.relevanceScore != null
                            ? `${Math.round(item.relevanceScore * 100)}%`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                          {new Date(item.publishedAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-4 py-3">
                          <ToggleVisibleButton id={item.id} isVisible={item.isVisible} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6">
              {page > 1 && (
                <Link href={pageUrl(page - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                  ← 이전
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const mid = Math.min(Math.max(page, 4), totalPages - 3)
                const start = Math.max(1, mid - 3)
                const n = start + i
                if (n > Math.min(totalPages, start + 6)) return null
                return (
                  <Link
                    key={n}
                    href={pageUrl(n)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                      n === page ? 'bg-[#1B3A6B] text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {n}
                  </Link>
                )
              })}
              {page < totalPages && (
                <Link href={pageUrl(page + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                  다음 →
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'sources' && (
        <NewsSourceManager
          initialSources={sources}
          categories={categories.filter((category) => category.isEnabled)}
        />
      )}

      {tab === 'categories' && (
        <NewsCategoryManager initialCategories={categories} />
      )}
    </div>
  )
}

function ToggleVisibleButton({ id, isVisible }: { id: string; isVisible: boolean }) {
  return (
    <form
      action={async () => {
        'use server'
        const { auth: authFn } = await import('@/lib/auth')
        const { prisma: db } = await import('@/lib/prisma')
        const session = await authFn()
        if (session?.user?.role !== 'ADMIN') return
        await db.news.update({
          where: { id },
          data: { isVisible: !isVisible },
        })
      }}
    >
      <button
        type="submit"
        title={isVisible ? '비공개로 전환' : '공개로 전환'}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          isVisible
            ? 'text-gray-400 hover:text-red-500'
            : 'text-gray-300 hover:text-green-500'
        }`}
      >
        {isVisible ? '숨김' : '공개'}
      </button>
    </form>
  )
}
