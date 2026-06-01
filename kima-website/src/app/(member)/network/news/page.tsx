import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'
import { NewsCategoryTabs } from '@/components/news/NewsCategoryTabs'
import { NewsCard } from '@/components/news/NewsCard'
import type { NewsCardItem } from '@/components/news/NewsCard'
import { getNewsCategories } from '@/lib/newsCategories'
import { isMissionRelevantArticle } from '@/lib/newsMissionRelevance'

export const dynamic = 'force-dynamic'

const ROLE_WEIGHT: Record<string, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

/** 일반회원(MEMBER) 이상 여부 확인 */
function isMemberOrAbove(role?: string | null) {
  return (ROLE_WEIGHT[role ?? ''] ?? 0) >= 1
}

const PAGE_SIZE = 12
const BASE_PATH = '/network/news'

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

export default async function NetworkNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  // ── 접근 권한 확인 ────────────────────────────────────────────────────────
  const session = await auth()
  const isLoggedIn = !!session?.user
  const hasAccess  = isMemberOrAbove(session?.user?.role)

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        {/* 헤더 */}
        <div className="bg-[#1B3A6B] text-white py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">AI News</p>
            <h1 className="text-2xl font-bold">이주민·다문화 뉴스</h1>
            <p className="mt-2 text-blue-200 text-sm">AI가 매일 수집·요약한 이주민·다문화 관련 최신 뉴스</p>
          </div>
        </div>

        {/* 접근 제한 안내 */}
        <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">회원 전용 콘텐츠입니다</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              이주민·다문화 뉴스는 <strong>일반회원 이상</strong>만 열람하실 수 있습니다.<br />
              {isLoggedIn
                ? '현재 계정의 권한으로는 이 페이지에 접근할 수 없습니다.'
                : '회원가입 후 로그인하시면 무료로 이용하실 수 있습니다.'}
            </p>
            <div className="flex flex-col gap-3">
              {!isLoggedIn && (
                <>
                  <Link
                    href="/auth/register"
                    className="block w-full py-3 rounded-xl bg-[#1B3A6B] text-white text-sm font-semibold hover:bg-[#142d54] transition-colors"
                  >
                    회원가입 하기
                  </Link>
                  <Link
                    href={`/auth/login?callbackUrl=${encodeURIComponent('/network/news')}`}
                    className="block w-full py-3 rounded-xl border-2 border-[#1B3A6B] text-[#1B3A6B] text-sm font-semibold hover:bg-[#1B3A6B]/5 transition-colors"
                  >
                    로그인
                  </Link>
                </>
              )}
              <Link
                href="/"
                className="block w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { category: rawCategory, page: rawPage } = await searchParams
  const categories = await getNewsCategories()
  const validCategoryKeys = new Set(categories.map((category) => category.key))

  const category = rawCategory?.toUpperCase()
  const validCategory =
    category && validCategoryKeys.has(category)
      ? category
      : undefined

  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    isVisible: true,
    ...(validCategory ? { category: validCategory } : {}),
  }

  const visibleItems = await prisma.news.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
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
  })

  const filteredItems = visibleItems.filter((item) =>
    isMissionRelevantArticle({
      title: item.title,
      summary: item.summary ?? '',
      url: item.sourceUrl,
    }),
  )
  const total = filteredItems.length
  const rawItems = filteredItems.slice(skip, skip + PAGE_SIZE)

  const items: NewsCardItem[] = rawItems.map((n) => ({
    ...n,
    summary:        n.summary,
    relevanceScore: n.relevanceScore,
    keywords:       n.keywords as string[],
  }))

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (validCategory) params.set('category', validCategory)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `${BASE_PATH}${qs ? `?${qs}` : ''}`
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 카테고리 탭 */}
        <Suspense fallback={<div className="h-10 bg-gray-100 rounded animate-pulse mb-6" />}>
          <NewsCategoryTabs currentCategory={validCategory ?? 'ALL'} categories={categories} />
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
              관리자가 뉴스 수집을 시작하면 자동으로 업데이트됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} categories={categories} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-10" aria-label="페이지 이동">
            {page > 1 ? (
              <Link href={pageUrl(page - 1)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-all">
                ← 이전
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg text-sm text-gray-300 select-none">← 이전</span>
            )}

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const mid   = Math.min(Math.max(page, 4), totalPages - 3)
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

            {page < totalPages ? (
              <Link href={pageUrl(page + 1)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-all">
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
