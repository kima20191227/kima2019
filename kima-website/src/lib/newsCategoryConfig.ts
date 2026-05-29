import type { RawArticle } from './newsCollector'

export interface NewsCategoryConfig {
  key: string
  label: string
  colorClass: string
  keywords: string[]
  order: number
  isEnabled: boolean
  isSystem: boolean
}

export const DEFAULT_NEWS_CATEGORIES: NewsCategoryConfig[] = [
  {
    key: 'LAW',
    label: '법령·정책',
    colorClass: 'bg-blue-100 text-blue-700',
    keywords: ['법령', '법률', '정책', '제도', '출입국', '체류', '비자', '법무부', '시행령'],
    order: 10,
    isEnabled: true,
    isSystem: true,
  },
  {
    key: 'STATISTICS',
    label: '통계·연구',
    colorClass: 'bg-violet-100 text-violet-700',
    keywords: ['통계', '연구', '조사', '보고서', '인구', '지표', '실태조사'],
    order: 20,
    isEnabled: true,
    isSystem: true,
  },
  {
    key: 'MULTICULTURAL',
    label: '다문화가족',
    colorClass: 'bg-pink-100 text-pink-700',
    keywords: ['다문화가족', '다문화 가정', '다문화가정', '다문화 자녀', '다문화자녀', '결혼이민자', '가족센터', '방문교육', '자조모임'],
    order: 30,
    isEnabled: true,
    isSystem: true,
  },
  {
    key: 'MIGRANT_WORKER',
    label: '이주노동자',
    colorClass: 'bg-amber-100 text-amber-700',
    keywords: ['이주노동자', '외국인근로자', '외국인 근로자', '고용허가제', '고용허가', '노동자', '근로자', 'E-9', 'H-2'],
    order: 40,
    isEnabled: true,
    isSystem: true,
  },
  {
    key: 'STUDENT',
    label: '유학생',
    colorClass: 'bg-emerald-100 text-emerald-700',
    keywords: ['유학생', '외국인학생', '외국인 학생', '다문화학생', '국제학생', '한국어교육'],
    order: 50,
    isEnabled: true,
    isSystem: true,
  },
  {
    key: 'OTHER',
    label: '기타',
    colorClass: 'bg-gray-100 text-gray-600',
    keywords: [],
    order: 999,
    isEnabled: true,
    isSystem: true,
  },
]

export function normalizeNewsCategoryKey(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

export function getNewsCategoryMeta(categories: NewsCategoryConfig[], key: string) {
  return categories.find((category) => category.key === key)
    ?? categories.find((category) => category.key === 'OTHER')
    ?? DEFAULT_NEWS_CATEGORIES[DEFAULT_NEWS_CATEGORIES.length - 1]
}

export function sortNewsCategories(categories: NewsCategoryConfig[]) {
  return [...categories].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'ko'))
}

export function parseNewsCategory(raw: string | undefined, categories: NewsCategoryConfig[]): string {
  const trimmed = raw?.trim()
  if (!trimmed) return 'OTHER'

  const normalized = normalizeNewsCategoryKey(trimmed)
  const direct = categories.find((category) => category.key === normalized || category.key === trimmed)
  if (direct) return direct.key

  const byLabel = categories.find((category) => {
    if (trimmed === category.label || trimmed.includes(category.label)) return true
    return category.key !== 'OTHER' && category.keywords.some((keyword) => trimmed.includes(keyword))
  })

  return byLabel?.key ?? 'OTHER'
}

export function inferNewsCategory(
  article: RawArticle,
  categories: NewsCategoryConfig[],
  fallbackCategory = 'OTHER',
): string {
  const enabled = categories.filter((category) => category.isEnabled && category.key !== 'OTHER')
  const haystack = [
    article.title,
    article.summary,
    article.sourceName,
    article.keywords.join(' '),
  ].join(' ').toLowerCase()

  let bestKey = fallbackCategory && fallbackCategory !== 'OTHER' ? fallbackCategory : 'OTHER'
  let bestScore = fallbackCategory && fallbackCategory !== 'OTHER' ? 2 : 0

  for (const category of enabled) {
    let score = article.defaultCategory === category.key ? 2 : 0
    for (const keyword of category.keywords) {
      const needle = keyword.toLowerCase()
      if (!needle) continue
      if (article.title.toLowerCase().includes(needle)) score += 4
      if (article.summary.toLowerCase().includes(needle)) score += 2
      if (article.sourceName.toLowerCase().includes(needle)) score += 2
      if (article.keywords.some((tag) => tag.toLowerCase().includes(needle) || needle.includes(tag.toLowerCase()))) score += 3
      if (haystack.includes(needle)) score += 1
    }
    if (score > bestScore) {
      bestKey = category.key
      bestScore = score
    }
  }

  return bestKey
}
