import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'
import { NewsPageClient } from '@/components/story/NewsPageClient'
import type { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'KIMA 뉴스 | KIMA' }

export default async function NewsPage() {
  const [session, news] = await Promise.all([
    auth(),
    prisma.story.findMany({
      where: { type: 'NEWS', isPublished: true, status: 'APPROVED' },
      orderBy: { publishedAt: 'desc' },
    }).catch(() => []),
  ])

  const role = session?.user?.role as UserRole | undefined
  const isOfficer = role === 'OFFICER' || role === 'ADMIN'

  const serialized = news.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    excerpt: item.excerpt,
    linkUrl: item.linkUrl,
    source: item.source,
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    authorId: item.authorId,
  }))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">News</p>
          <h1 className="text-2xl font-bold">KIMA 뉴스</h1>
          <p className="mt-2 text-blue-200 text-sm">KIMA 관련 외부 언론 기사·뉴스를 모아봅니다.</p>
        </div>
      </div>

      <NewsPageClient
        news={serialized}
        isOfficer={isOfficer}
        currentUserId={session?.user?.id}
      />
    </div>
  )
}
