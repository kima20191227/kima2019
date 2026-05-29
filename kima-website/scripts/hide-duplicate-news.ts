import { prisma } from '@/lib/prisma'

type NewsRow = {
  id: string
  title: string
  sourceUrl: string
  sourceName: string
  category: string
  relevanceScore: number | null
  publishedAt: Date
  createdAt: Date
}

function normalizeArticleUrl(url: string): string {
  return url.replace(/[?#].*$/, '').trim().toLowerCase()
}

function normalizeArticleTitle(title: string): string {
  return title
    .normalize('NFKC')
    .replace(/<[^>]*>/g, '')
    .replace(/\.\.\./g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .toLowerCase()
}

function compareNews(a: NewsRow, b: NewsRow): number {
  const relevanceDiff = (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
  if (relevanceDiff !== 0) return relevanceDiff

  const publishedDiff = b.publishedAt.getTime() - a.publishedAt.getTime()
  if (publishedDiff !== 0) return publishedDiff

  return b.createdAt.getTime() - a.createdAt.getTime()
}

async function main() {
  const apply = process.argv.includes('--apply')

  const rows = await prisma.news.findMany({
    where: { isVisible: true },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      sourceName: true,
      category: true,
      relevanceScore: true,
      publishedAt: true,
      createdAt: true,
    },
  })

  const sorted = [...rows].sort(compareNews)
  const seenUrls = new Set<string>()
  const seenTitles = new Set<string>()
  const keepIds = new Set<string>()
  const hide: NewsRow[] = []

  for (const row of sorted) {
    const urlKey = normalizeArticleUrl(row.sourceUrl)
    const titleKey = normalizeArticleTitle(row.title)

    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) {
      hide.push(row)
      continue
    }

    seenUrls.add(urlKey)
    seenTitles.add(titleKey)
    keepIds.add(row.id)
  }

  if (apply && hide.length > 0) {
    await prisma.news.updateMany({
      where: { id: { in: hide.map((row) => row.id) } },
      data: { isVisible: false },
    })
  }

  console.log(JSON.stringify({
    apply,
    scanned: rows.length,
    kept: keepIds.size,
    hidden: hide.length,
    hiddenSample: hide.slice(0, 10).map((row) => ({
      title: row.title,
      sourceName: row.sourceName,
      category: row.category,
      relevanceScore: row.relevanceScore,
      publishedAt: row.publishedAt,
    })),
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
