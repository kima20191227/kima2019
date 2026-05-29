import { prisma } from '@/lib/prisma'
import { ensureDefaultNewsCategories, getNewsCategories } from '@/lib/newsCategories'
import { inferNewsCategory } from '@/lib/newsCategoryConfig'
import type { RawArticle } from '@/lib/newsCollector'

async function main() {
  const apply = process.argv.includes('--apply')
  await ensureDefaultNewsCategories()
  const categories = await getNewsCategories()

  const [news, sources] = await Promise.all([
    prisma.news.findMany({
      select: {
        id: true,
        title: true,
        summary: true,
        sourceUrl: true,
        sourceName: true,
        publishedAt: true,
        keywords: true,
        category: true,
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.newsSource.findMany({
      select: {
        name: true,
        defaultCategory: true,
      },
    }),
  ])

  const sourceCategory = new Map(sources.map((source) => [source.name, source.defaultCategory]))
  const updates: { id: string; from: string; to: string; title: string }[] = []

  for (const item of news) {
    const raw: RawArticle = {
      title: item.title,
      summary: item.summary ?? '',
      url: item.sourceUrl,
      sourceName: item.sourceName,
      publishedAt: item.publishedAt,
      keywords: item.keywords,
      defaultCategory: sourceCategory.get(item.sourceName) ?? item.category,
    }
    const nextCategory = inferNewsCategory(raw, categories, raw.defaultCategory ?? item.category)
    if (nextCategory !== item.category) {
      updates.push({ id: item.id, from: item.category, to: nextCategory, title: item.title })
    }
  }

  if (apply) {
    for (const update of updates) {
      await prisma.news.update({
        where: { id: update.id },
        data: { category: update.to },
      })
    }
  }

  const summary = updates.reduce<Record<string, number>>((acc, update) => {
    const key = `${update.from}->${update.to}`
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  console.log(JSON.stringify({ apply, scanned: news.length, updates: updates.length, summary }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
