import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import {
  LEGAL_CATEGORY_META,
  LEGAL_CATEGORY_ORDER,
  parseLegalCategory,
} from '@/lib/legalCategories'
import { LegalDocumentCard } from '@/components/legal/LegalDocumentCard'
import type { LegalDocumentCardItem } from '@/components/legal/LegalDocumentCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '법령&제도 | KIMA',
  description: '이주민과 다문화인을 위한 필수 법률·제도 정보를 제공합니다.',
}

const PAGE_SIZE = 10

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}

function makeUrl(params: { category?: string; q?: string; page?: number }) {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.q) search.set('q', params.q)
  if (params.page && params.page > 1) search.set('page', String(params.page))
  const qs = search.toString()
  return `/legal${qs ? `?${qs}` : ''}`
}

export default async function LegalPage({ searchParams }: PageProps) {
  const { category: rawCategory, q: rawQuery, page: rawPage } = await searchParams
  const activeCategory = parseLegalCategory(rawCategory)
  const query = rawQuery?.trim() ?? ''
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)
  const skip = (page - 1) * PAGE_SIZE

  const where = {
    accessLevel: 'PUBLIC' as const,
    ...(activeCategory ? { category: activeCategory } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' as const } },
            { summary: { contains: query, mode: 'insensitive' as const } },
            { content: { contains: query, mode: 'insensitive' as const } },
            { lawType: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, documents] = await Promise.all([
    prisma.legalDocument.count({ where }),
    prisma.legalDocument.findMany({
      where,
      orderBy: [
        { isLatest: 'desc' },
        { effectiveDate: 'desc' },
        { updatedAt: 'desc' },
      ],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        lawType: true,
        effectiveDate: true,
        sourceUrl: true,
        isLatest: true,
        accessLevel: true,
        viewCount: true,
        updatedAt: true,
      },
    }),
  ]).catch((): [number, LegalDocumentCardItem[]] => [0, []])

  const items: LegalDocumentCardItem[] = documents
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Legal Guide
          </p>
          <h1 className="text-3xl font-bold">법령&제도</h1>
          <p className="mt-3 text-blue-100 text-sm leading-relaxed max-w-2xl">
            다문화가족, 출입국, 비자, 난민, 외국인 고용, 사회보장 등
            이주민과 다문화 현장에서 자주 확인해야 하는 법률 정보를 정리합니다.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form action="/legal" className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          <label htmlFor="legal-search" className="sr-only">
            법령 검색
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="legal-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="법령명, 제도명, 체류자격, 키워드로 검색"
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-semibold hover:bg-[#15305a] transition-colors"
            >
              검색
            </button>
          </div>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          <Link
            href={makeUrl({ q: query })}
            className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            전체
          </Link>
          {LEGAL_CATEGORY_ORDER.map((key) => {
            const meta = LEGAL_CATEGORY_META[key]
            const active = activeCategory === key
            return (
              <Link
                key={key}
                href={makeUrl({ category: key, q: query })}
                className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {meta.label}
              </Link>
            )
          })}
        </div>

        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-800">{total.toLocaleString()}</span>건
            {query && <span className="ml-1">· “{query}” 검색 결과</span>}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/legal/sources" className="text-xs text-[#1B3A6B] hover:underline">
              공식 출처 보기
            </Link>
            <Link href="/network/news?category=LAW" className="text-xs text-[#1B3A6B] hover:underline">
              관련 정책 뉴스 보기
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-14 text-center">
            <p className="text-lg font-semibold text-gray-800">등록된 법령 정보가 없습니다</p>
            <p className="mt-2 text-sm text-gray-500">
              다른 카테고리나 검색어로 다시 확인해주세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {items.map((document) => (
              <LegalDocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-10" aria-label="페이지 이동">
            {page > 1 ? (
              <Link
                href={makeUrl({ category: activeCategory, q: query, page: page - 1 })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B]"
              >
                이전
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg text-sm text-gray-300">이전</span>
            )}
            <span className="px-3 py-2 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={makeUrl({ category: activeCategory, q: query, page: page + 1 })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white hover:border-[#1B3A6B] hover:text-[#1B3A6B]"
              >
                다음
              </Link>
            ) : (
              <span className="px-3 py-2 rounded-lg text-sm text-gray-300">다음</span>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
