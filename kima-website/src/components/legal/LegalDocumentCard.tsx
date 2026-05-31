import Link from 'next/link'
import type { AccessLevel, LegalCategory } from '@prisma/client'
import {
  ACCESS_LEVEL_META,
  LEGAL_CATEGORY_META,
  formatLegalDate,
} from '@/lib/legalCategories'
import { cn } from '@/lib/utils'

export interface LegalDocumentCardItem {
  id: string
  title: string
  summary: string | null
  category: LegalCategory
  lawType: string | null
  effectiveDate: Date | string | null
  sourceUrl: string | null
  isLatest: boolean
  accessLevel: AccessLevel
  viewCount: number
  updatedAt: Date | string
}

interface LegalDocumentCardProps {
  document: LegalDocumentCardItem
}

export function LegalDocumentCard({ document }: LegalDocumentCardProps) {
  const category = LEGAL_CATEGORY_META[document.category]
  const access = ACCESS_LEVEL_META[document.accessLevel]
  const effectiveDate = formatLegalDate(document.effectiveDate)
  const updatedAt = formatLegalDate(document.updatedAt)

  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#C8922A]/40 transition-all p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-semibold', category.className)}>
          {category.label}
        </span>
        {document.lawType && (
          <span className="px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
            {document.lawType}
          </span>
        )}
        <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-medium', access.className)}>
          {access.label}
        </span>
        {document.isLatest && (
          <span className="px-2.5 py-0.5 rounded-full bg-[#1B3A6B] text-white text-xs font-semibold">
            최신
          </span>
        )}
      </div>

      <Link href={`/legal/${document.id}`} className="group block">
        <h2 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#1B3A6B] transition-colors">
          {document.title}
        </h2>
      </Link>

      {document.summary && (
        <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
          {document.summary}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
        {effectiveDate && <span>시행일 {effectiveDate}</span>}
        <span>수정 {updatedAt}</span>
        <span>조회 {document.viewCount.toLocaleString()}</span>
      </div>
    </article>
  )
}
