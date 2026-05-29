'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { NewsCategoryConfig } from '@/lib/newsCategoryConfig'

interface Props {
  currentCategory?: string
  categories: NewsCategoryConfig[]
}

export function NewsCategoryTabs({ currentCategory, categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const active = currentCategory?.toUpperCase() || 'ALL'

  const handleClick = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (key === 'ALL') {
        params.delete('category')
      } else {
        params.set('category', key)
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const tabs = [{ key: 'ALL', label: '전체' }, ...categories.map(({ key, label }) => ({ key, label }))]

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-200 mb-6">
      {tabs.map((tab) => {
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
