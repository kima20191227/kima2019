import { prisma } from '@/lib/prisma'
import type { RawArticle } from '@/lib/newsCollector'
import { isMissionRelevantArticle } from '@/lib/newsMissionRelevance'

async function main() {
  const apply = process.argv.includes('--apply')

  const rows = await prisma.news.findMany({
    where: { isVisible: true },
    select: {
      id: true,
      title: true,
      summary: true,
      sourceUrl: true,
      sourceName: true,
      publishedAt: true,
      keywords: true,
      category: true,
      relevanceScore: true,
    },
  })

  const hidden = rows.filter((row) => {
    const article: RawArticle = {
      title: row.title,
      summary: row.summary ?? '',
      url: row.sourceUrl,
      sourceName: row.sourceName,
      publishedAt: row.publishedAt,
      keywords: row.keywords as string[],
      defaultCategory: row.category,
    }

    return !isMissionRelevantArticle(article)
  })

  if (apply && hidden.length > 0) {
    await prisma.news.updateMany({
      where: { id: { in: hidden.map((row) => row.id) } },
      data: { isVisible: false },
    })
  }

  console.log(JSON.stringify({
    apply,
    scanned: rows.length,
    hidden: hidden.length,
    sample: hidden.slice(0, 20).map((row) => ({
      title: row.title,
      sourceName: row.sourceName,
      category: row.category,
      relevanceScore: row.relevanceScore,
      sourceUrl: row.sourceUrl,
    })),
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
