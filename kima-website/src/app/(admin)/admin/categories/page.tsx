import { prisma } from '@/lib/prisma'
import { CategoryOfficerForm } from '@/components/admin/CategoryOfficerForm'
import { CategoryAddForm, CategoryDeleteButton, CategoryRenameForm } from '@/components/admin/CategoryAddForm'
import { SeedCategoryOfficersButton } from '@/components/admin/SeedCategoryOfficersButton'
import type { Metadata } from 'next'
import type { CategoryType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '카테고리 관리 | KIMA 관리자' }

const TYPE_LABELS: Record<CategoryType, string> = {
  REGION: '지역별',
  LANGUAGE: '언어권별',
  TARGET: '사역대상별',
}

export default async function AdminCategoriesPage() {
  type CategoryRow = {
    id: string; type: CategoryType; name: string; slug: string; order: number
    flag: string | null
    officerName: string | null; officerPhone: string | null; officerEmail: string | null
    officerSns: string | null; officerQr: string | null; createdAt: Date
  }

  let categories: CategoryRow[]
  try {
    const rows = await prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    })
    categories = rows.map(r => ({
      ...r,
      flag: (r as unknown as { flag?: string | null }).flag ?? null,
      officerPhone: (r as unknown as { officerPhone?: string | null }).officerPhone ?? null,
      officerEmail: (r as unknown as { officerEmail?: string | null }).officerEmail ?? null,
    }))
  } catch {
    const rows = await prisma.category.findMany({
      select: { id: true, type: true, name: true, slug: true, order: true,
        flag: true, officerName: true, officerSns: true, officerQr: true, createdAt: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    })
    categories = rows.map(r => ({ ...r, officerPhone: null, officerEmail: null }))
  }

  const grouped = categories.reduce<Record<CategoryType, typeof categories>>(
    (acc, cat) => {
      if (!acc[cat.type]) acc[cat.type] = []
      acc[cat.type].push(cat)
      return acc
    },
    { REGION: [], LANGUAGE: [], TARGET: [] }
  )

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">카테고리 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            담당 위원장 정보 편집, 언어권별·사역대상별 카테고리 추가·삭제가 가능합니다.
          </p>
        </div>
        <SeedCategoryOfficersButton />
      </div>

      <div className="space-y-8">
        {(Object.keys(TYPE_LABELS) as CategoryType[]).map((type) => (
          <div key={type}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {TYPE_LABELS[type]}
                <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                  ({grouped[type].length}개)
                </span>
              </h2>
              <CategoryAddForm type={type} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {grouped[type].length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">
                  등록된 카테고리가 없습니다. 위의 추가 버튼을 눌러 추가하세요.
                </div>
              ) : (
                grouped[type].map((cat) => (
                  <div key={cat.id} className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      {/* 이름 + slug (수정 가능) */}
                      <div className="w-36 flex-shrink-0">
                        <CategoryRenameForm
                          categoryId={cat.id}
                          name={cat.name}
                          slug={cat.slug}
                          type={cat.type}
                          flag={cat.flag}
                        />
                      </div>

                      {/* 담당자 편집 폼 */}
                      <div className="flex-1">
                        <CategoryOfficerForm
                          categoryId={cat.id}
                          officerName={cat.officerName}
                          officerPhone={cat.officerPhone}
                          officerEmail={cat.officerEmail}
                          officerSns={cat.officerSns}
                          officerQr={cat.officerQr}
                        />
                      </div>

                      {/* 삭제 버튼 (LANGUAGE, TARGET만) */}
                      <CategoryDeleteButton
                        categoryId={cat.id}
                        categoryName={cat.name}
                        categoryType={cat.type}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}
