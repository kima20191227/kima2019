import { prisma } from '@/lib/prisma'
import {
  DEFAULT_NEWS_CATEGORIES,
  sortNewsCategories,
  type NewsCategoryConfig,
} from '@/lib/newsCategoryConfig'

export async function ensureDefaultNewsCategories() {
  await Promise.all(
    DEFAULT_NEWS_CATEGORIES.map((category) =>
      prisma.newsCategoryConfig.upsert({
        where: { key: category.key },
        update: {
          label: category.label,
          colorClass: category.colorClass,
          keywords: category.keywords,
          order: category.order,
          isEnabled: true,
          isSystem: true,
        },
        create: category,
      }),
    ),
  )
}

export async function getNewsCategories(): Promise<NewsCategoryConfig[]> {
  try {
    const rows = await prisma.newsCategoryConfig.findMany({
      where: { isEnabled: true },
      orderBy: [{ order: 'asc' }, { label: 'asc' }],
    })
    if (rows.length > 0) return rows
  } catch {
    return DEFAULT_NEWS_CATEGORIES
  }

  return DEFAULT_NEWS_CATEGORIES
}

export async function getAllNewsCategories(): Promise<NewsCategoryConfig[]> {
  try {
    const rows = await prisma.newsCategoryConfig.findMany({
      orderBy: [{ order: 'asc' }, { label: 'asc' }],
    })
    return rows.length > 0 ? rows : sortNewsCategories(DEFAULT_NEWS_CATEGORIES)
  } catch {
    return sortNewsCategories(DEFAULT_NEWS_CATEGORIES)
  }
}
