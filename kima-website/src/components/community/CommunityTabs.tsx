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

// 언어권별 ISO 국가 코드 (flagcdn.com 이미지 사용)
const LANGUAGE_FLAG_CODES: Record<string, string> = {
  // slug 기준
  vietnam:     'vn',
  viet:        'vn',
  nepal:       'np',
  mongol:      'mn',
  mongolia:    'mn',
  indonesia:   'id',
  filippin:    'ph',
  philippines: 'ph',
  russia:      'ru',
  russian:     'ru',
  china:       'cn',
  chinese:     'cn',
  thai:        'th',
  thailand:    'th',
  srilanka:    'lk',
  'sri-lanka': 'lk',
  myanmar:     'mm',
  cambodia:    'kh',
  bangladesh:  'bd',
  pakistan:    'pk',
  uzbekistan:  'uz',
  india:       'in',
  kazakhstan:  'kz',
  // 한국어 name 기준 (fallback)
  '베트남':      'vn',
  '네팔':        'np',
  '몽골':        'mn',
  '인도네시아':  'id',
  '필리핀':      'ph',
  '러시아':      'ru',
  '중국':        'cn',
  '태국':        'th',
  '스리랑카':    'lk',
  '미얀마':      'mm',
  '캄보디아':    'kh',
  '방글라데시':  'bd',
  '파키스탄':    'pk',
  '우즈베키스탄':'uz',
  '인도':        'in',
  '카자흐스탄':  'kz',
}

function getLanguageFlagCode(slug: string, name: string): string | null {
  return (
    LANGUAGE_FLAG_CODES[slug.toLowerCase()] ??
    LANGUAGE_FLAG_CODES[name] ??
    null
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
              {cat.type === 'LANGUAGE' ? (
                (() => {
                  const code = getLanguageFlagCode(cat.slug, cat.name)
                  return code ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://flagcdn.com/w80/${code}.png`}
                      alt={`${cat.name} 국기`}
                      width={56}
                      height={40}
                      className="rounded object-cover shadow-sm"
                    />
                  ) : (
                    <span className="text-3xl">🌐</span>
                  )
                })()
              ) : (
                <span className="text-3xl">{TYPE_EMOJI[cat.type]}</span>
              )}
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
