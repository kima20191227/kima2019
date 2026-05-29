import { prisma } from '@/lib/prisma'
import { fetchArticleSummaryPreview } from '@/lib/newsCollector'

const LIMIT = 80
const CONCURRENCY = 3

function hasTruncatedText(input: string): boolean {
  return /(\.\.\.|…)/.test(input)
}

function needsRefresh(input: string | null): boolean {
  const text = input ?? ''
  return hasTruncatedText(text)
    || /[{}]|\$\{|\.substring|byteLen|&#\d+;|internet explorer|browser|최신 브라우저|사용을 권장/i.test(text)
}

async function main() {
  const apply = process.argv.includes('--apply')

  const candidates = await prisma.news.findMany({
    where: {
      isVisible: true,
    },
    orderBy: [
      { relevanceScore: 'desc' },
      { publishedAt: 'desc' },
    ],
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      summary: true,
    },
  })
  const rows = candidates.filter((row) => needsRefresh(row.summary)).slice(0, LIMIT)

  let cursor = 0
  const updates: Array<{ id: string; title: string; before: number; after: number }> = []

  const workers = Array.from({ length: Math.min(CONCURRENCY, rows.length) }, async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++]
      const preview = await fetchArticleSummaryPreview(row.sourceUrl)

      if (
        preview.length > (row.summary?.length ?? 0) &&
        !hasTruncatedText(preview)
      ) {
        updates.push({
          id: row.id,
          title: row.title,
          before: row.summary?.length ?? 0,
          after: preview.length,
        })

        if (apply) {
          await prisma.news.update({
            where: { id: row.id },
            data: { summary: preview.slice(0, 1000) },
          })
        }
      }
    }
  })

  await Promise.all(workers)

  console.log(JSON.stringify({
    apply,
    scanned: rows.length,
    updated: updates.length,
    sample: updates.slice(0, 10),
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
