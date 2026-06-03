import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { NewsPageClient } from '@/components/story/NewsPageClient'

export const revalidate = 1800

export const metadata: Metadata = { title: 'KIMA 보도자료 | KIMA' }

export default async function NewsPage() {
  const news = await prisma.story.findMany({
    where: { type: 'NEWS', isPublished: true, status: 'APPROVED' },
    orderBy: { publishedAt: 'desc' },
  }).catch(() => [])

  const serialized = news.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    excerpt: item.excerpt,
    linkUrl: item.linkUrl,
    source: item.source,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    authorId: item.authorId,
    thumbnail: item.thumbnail,
    videoUrls: item.videoUrls,
  }))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">News</p>
          <h1 className="text-2xl font-bold">KIMA 보도자료</h1>
          <p className="mt-2 text-blue-200 text-sm">KIMA 관련 외부 언론 기사·보도자료를 모아봅니다.</p>
        </div>
      </div>

      <NewsPageClient news={serialized} />
    </div>
  )
}
