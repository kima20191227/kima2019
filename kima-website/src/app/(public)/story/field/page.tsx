import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { FieldStoryGrid, type FieldStoryItem } from '@/components/story/FieldStoryGrid'
import { MemberWriteButton } from '@/components/story/MemberWriteButton'

export const revalidate = 1800

export const metadata: Metadata = { title: '사역현장 이야기 | KIMA' }

export default async function FieldStoryPage() {
  const raw = await prisma.story.findMany({
    where: { type: 'FIELD_STORY', isPublished: true, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      excerpt: true,
      thumbnail: true,
      images: true,
      videoUrls: true,
      tags: true,
      authorName: true,
      ministryLocation: true,
      createdAt: true,
    },
  }).catch(() => [])

  // Date → string (서버→클라이언트 직렬화)
  const stories: FieldStoryItem[] = raw.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Field Story</p>
            <h1 className="text-2xl font-bold">사역현장 이야기</h1>
            <p className="mt-2 text-blue-200 text-sm">회원들이 직접 나누는 현장 사역 이야기입니다.</p>
          </div>
          <MemberWriteButton href="/story/field/write" label="이야기 올리기" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {stories.length === 0 ? (
          <p className="text-center text-gray-400 py-20">등록된 이야기가 없습니다.</p>
        ) : (
          <FieldStoryGrid stories={stories} />
        )}
      </div>
    </div>
  )
}
