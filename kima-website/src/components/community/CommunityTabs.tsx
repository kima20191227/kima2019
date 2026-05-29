'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import type { CategoryType } from '@prisma/client'

type CategorySummary = {
  id: string
  type: CategoryType
  name: string
  slug: string
  order: number
  officerName: string | null
  officerSns: string | null
  officerQr: string | null
  createdAt: Date
}
import { cn } from '@/lib/utils'

const TAB_CONFIG: Array<{ key: CategoryType; label: string; urlKey: string }> = [
  { key: 'REGION', label: '지역별', urlKey: 'region' },
  { key: 'LANGUAGE', label: '언어권별', urlKey: 'language' },
  { key: 'TARGET', label: '사역대상별', urlKey: 'target' },
]

const TYPE_EMOJI: Record<CategoryType, string> = {
  REGION: '📍',
  LANGUAGE: '🌐',
  TARGET: '🤝',
}

// 언어권별 국기 이모지 (slug 또는 name으로 조회)
const LANGUAGE_FLAGS: Record<string, string> = {
  // slug 기준
  vietnam:     '🇻🇳',
  viet:        '🇻🇳',
  nepal:       '🇳🇵',
  mongol:      '🇲🇳',
  mongolia:    '🇲🇳',
  indonesia:   '🇮🇩',
  filippin:    '🇵🇭',
  philippines: '🇵🇭',
  russia:      '🇷🇺',
  russian:     '🇷🇺',
  china:       '🇨🇳',
  chinese:     '🇨🇳',
  thai:        '🇹🇭',
  thailand:    '🇹🇭',
  srilanka:    '🇱🇰',
  'sri-lanka': '🇱🇰',
  myanmar:     '🇲🇲',
  cambodia:    '🇰🇭',
  bangladesh:  '🇧🇩',
  pakistan:    '🇵🇰',
  uzbekistan:  '🇺🇿',
  // 한국어 name 기준 (fallback)
  '베트남':    '🇻🇳',
  '네팔':      '🇳🇵',
  '몽골':      '🇲🇳',
  '인도네시아': '🇮🇩',
  '필리핀':    '🇵🇭',
  '러시아':    '🇷🇺',
  '중국':      '🇨🇳',
  '태국':      '🇹🇭',
  '스리랑카':  '🇱🇰',
  '미얀마':    '🇲🇲',
  '캄보디아':  '🇰🇭',
  '방글라데시': '🇧🇩',
  '파키스탄':  '🇵🇰',
  '우즈베키스탄': '🇺🇿',
  '인도':      '🇮🇳',
  '카자흐스탄': '🇰🇿',
}

function getLanguageFlag(slug: string, name: string): string {
  return (
    LANGUAGE_FLAGS[slug.toLowerCase()] ??
    LANGUAGE_FLAGS[name] ??
    '🌐'
  )
}

interface CommunityTabsProps {
  categories: CategorySummary[]
}

export function CommunityTabs({ categories }: CommunityTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const tabParam = searchParams.get('tab') as CategoryType | null
  const activeTab: CategoryType =
    tabParam && TAB_CONFIG.some((t) => t.key === tabParam) ? tabParam : 'REGION'

  const filtered = categories.filter((c) => c.type === activeTab)

  const handleTabClick = (key: CategoryType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div>
      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={cn(
              'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-[#1B3A6B] text-[#1B3A6B]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 카테고리 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((cat) => {
          const urlKey = TAB_CONFIG.find((t) => t.key === cat.type)?.urlKey ?? 'region'
          return (
            <Link
              key={cat.id}
              href={`/community/${urlKey}/${cat.slug}`}
              className="flex flex-col items-center justify-center gap-2 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-[#1B3A6B] hover:shadow-md transition-all group"
            >
              <span className="text-3xl">
                {cat.type === 'LANGUAGE'
                  ? getLanguageFlag(cat.slug, cat.name)
                  : TYPE_EMOJI[cat.type]}
              </span>
              <span className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#1B3A6B] transition-colors text-center">
                {cat.name}
              </span>
              {cat.officerName && (
                <span className="text-xs text-gray-400 text-center">
                  담당: {cat.officerName}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          카테고리가 없습니다.
        </div>
      )}
    </div>
  )
}
