import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import type { NewsCategory } from '@prisma/client'
import { NewsCategoryTabs } from '@/components/news/NewsCategoryTabs'
import { NewsCard } from '@/components/news/NewsCard'
import type { NewsCardItem } from '@/components/news/NewsCard'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 12

const VALID_CATEGORIES = new Set<NewsCategory>([
  'LAW', 'STATISTICS', 'MULTICULTURAL', 'MIGRANT_WORKER', 'STUDENT', 'OTHER',
])

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}): Promise<Metadata> {
  const { category } = await searchParams
  const suffix = category ? ` — ${category}` : ''
  return {
    title:       `이주민·다문화 뉴스${suffix} | KIMA`,
    description: 'AI가 매일 수집·요약한 이주민·다문화 관련 최신 뉴스입니다.',
  }
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { category: rawCategory, page: rawPage } = await searchParams

  const category = rawCategory?.toUpperCase()
  const validCategory =
    category && VALID_CATEGORIES.has(category as NewsCategory)
      ? (category as NewsCategory)
      : undefined

  const page  = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const skip  = (page - 1) * PAGE_SIZE

  const where = {
    isVisible: true,
    ...(validCategory ? { category: validCategory } : {}),
  }

  // 전체 건수 + 목록 병렬 조회
  const [total, rawItems] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: PAGE_SIZE,
      select: {
        id:             true,
        title:          true,
        summary:        true,
        sourceUrl:      true,
        sourceName:     true,
        category:       true,
        publishedAt:    true,
        relevanceScore: true,
        keywords:       true,
      },
    }),
  ])

  const items: NewsCardItem[] = rawItems.map((n) => ({
    ...n,
    summary:        n.summary,
    relevanceScore: n.relevanceScore,
    keywords:       n.keywords as string[],
  }))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // 페이지네이션용 URL 헬퍼
  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (validCategory) params.set('category', validCategory)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/data/news${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            AI News
          </p>
          <h1 className="text-2xl font-bold">이주민·다문화 뉴스</h1>
          <p className="mt-2 text-blue-200 text-sm">
            AI가 매일 수집·요약한 이주민·다문화 관련 최신 뉴스
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 카테고리 탭 */}
        <Suspense fallback={<div className="h-10 bg-gray-100 rounded animate-pulse mb-6" />}>
          <NewsCategoryTabs currentCategory={validCategory ?? 'ALL'} />
        </Suspense>

        {/* 결과 건수 */}
        <p className="text-sm text-gray-500 mb-5">
          {validCategory ? '' : '전체 '}
          <span className="font-semibold text-gray-800">{total.toLocaleString()}</span>건
          {page > 1 && <span className="ml-1">· {page}/{totalPages} 페이지</span>}
        </p>

        {/* 뉴스 카드 그리드 */}
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-3">📰</p>
            <p className="text-gray-500 font-medium">아직 수집된 뉴스가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">
              관리자가 뉴스 소스를 등록하면 자동으로 수집됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-10" aria-label="페이지 이동">

            {/* 이전 */}
            {page > 1 ? (
              <Link
                href={pageUrl(page - 1)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-all"
              >
                ← 이전
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg text-sm text-gray-300 select-none">← 이전</span>
            )}

            {/* 페이지 번호 */}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // 현재 페이지 주변 번호만 표시
              const mid = Math.min(Math.max(page, 4), totalPages - 3)
              const start = Math.max(1, mid - 3)
              const end   = Math.min(totalPages, start + 6)
              const num   = start + i
              if (num > end) return null
              return (
                <Link
                  key={num}
                  href={pageUrl(num)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    num === page
                      ? 'bg-[#1B3A6B] text-white shadow-sm'
                      : 'border border-gray-200 text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B]'
                  }`}
                >
                  {num}
                </Link>
              )
            })}

            {/* 다음 */}
            {page < totalPages ? (
              <Link
                href={pageUrl(page + 1)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-all"
              >
                다음 →
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg text-sm text-gray-300 select-none">다음 →</span>
            )}
          </nav>
        )}

      </div>
    </div>
  )
}
