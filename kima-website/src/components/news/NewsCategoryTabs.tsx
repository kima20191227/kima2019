'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

type CategoryKey = 'ALL' | 'LAW' | 'STATISTICS' | 'MULTICULTURAL' | 'MIGRANT_WORKER' | 'STUDENT' | 'OTHER'

const TABS: { key: CategoryKey; label: string }[] = [
  { key: 'ALL',            label: '전체' },
  { key: 'LAW',            label: '법령·정책' },
  { key: 'STATISTICS',     label: '통계·연구' },
  { key: 'MULTICULTURAL',  label: '다문화가족' },
  { key: 'MIGRANT_WORKER', label: '이주노동자' },
  { key: 'STUDENT',        label: '유학생' },
  { key: 'OTHER',          label: '기타' },
]

interface Props {
  currentCategory?: string
}

export function NewsCategoryTabs({ currentCategory }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const active = (currentCategory?.toUpperCase() || 'ALL') as CategoryKey

  const handleClick = useCallback(
    (key: CategoryKey) => {
      const params = new URLSearchParams(searchParams.toString())
      if (key === 'ALL') {
        params.delete('category')
      } else {
        params.set('category', key)
      }
      params.delete('page')   // 탭 변경 시 첫 페이지로 리셋
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-200 mb-6">
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleClick(tab.key)}
            className={cn(
              'flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              isActive
                ? 'border-[#1B3A6B] text-[#1B3A6B]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
