import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import { NewsSettingsForm } from '@/components/admin/NewsSettingsForm'
import { NewsSourceManager } from '@/components/admin/NewsSourceManager'
import { NewsCategoryManager } from '@/components/admin/NewsCategoryManager'
import { NewsListManager, type NewsSortOption, type NewsStatusFilter } from '@/components/admin/NewsListManager'
import { ensureDefaultNewsCategories, getAllNewsCategories } from '@/lib/newsCategories'
import { getNewsCategoryMeta } from '@/lib/newsCategoryConfig'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '뉴스 관리 | KIMA 관리자' }

type Tab = 'settings' | 'list' | 'sources' | 'categories'

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; status?: string; sort?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/')

  await ensureDefaultNewsCategories()

  const { tab: rawTab, page: rawPage, status: rawStatus, sort: rawSort } = await searchParams
  const tab: Tab =
    rawTab === 'list' || rawTab === 'sources' || rawTab === 'categories'
      ? rawTab
      : 'settings'

  const status: NewsStatusFilter =
    rawStatus === 'visible' || rawStatus === 'hidden' ? rawStatus : 'all'
  const sort: NewsSortOption =
    rawSort === 'relevance_asc' || rawSort === 'relevance_desc' ? rawSort : 'latest'

  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const PAGE_SIZE = 20
  const skip = (page - 1) * PAGE_SIZE

  const newsWhere: Prisma.NewsWhereInput =
    status === 'visible' ? { isVisible: true } : status === 'hidden' ? { isVisible: false } : {}

  const newsOrderBy: Prisma.NewsOrderByWithRelationInput =
    sort === 'relevance_asc'
      ? { relevanceScore: 'asc' }
      : sort === 'relevance_desc'
        ? { relevanceScore: 'desc' }
        : { publishedAt: 'desc' }

  const categories = await getAllNewsCategories()

  const [newsTotal, newsItems, sourceCount, categoryCount, hiddenCount] = await Promise.all([
    tab === 'list' ? prisma.news.count({ where: newsWhere }) : Promise.resolve(0),
    tab === 'list'
      ? prisma.news.findMany({
          where: newsWhere,
          orderBy: newsOrderBy,
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
    tab === 'list' ? prisma.news.count({ where: { isVisible: false } }) : Promise.resolve(0),
  ])

  const sources =
    tab === 'sources'
      ? await prisma.newsSource.findMany({ orderBy: { order: 'asc' } })
      : []

  const totalPages = Math.ceil(newsTotal / PAGE_SIZE)

  const listItems = newsItems.map((item) => {
    const meta = getNewsCategoryMeta(categories, item.category)
    return {
      id: item.id,
      title: item.title,
      sourceName: item.sourceName,
      categoryLabel: meta.label,
      categoryColorClass: meta.colorClass,
      relevanceLabel: item.relevanceScore != null ? `${Math.round(item.relevanceScore * 100)}%` : '-',
      publishedAtLabel: new Date(item.publishedAt).toLocaleDateString('ko-KR'),
      isVisible: item.isVisible,
    }
  })

  function tabUrl(nextTab: Tab) {
    return `/admin/news?tab=${nextTab}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">이주민 관련 뉴스 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            자동 수집 설정, 뉴스 목록, 수집 소스, 분류 카테고리를 관리합니다.
          </p>
        </div>
        <Link
          href="/network/news"
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
        <NewsListManager
          items={listItems}
          page={page}
          totalPages={totalPages}
          hiddenCount={hiddenCount}
          status={status}
          sort={sort}
        />
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
