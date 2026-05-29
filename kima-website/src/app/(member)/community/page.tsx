import { prisma } from '@/lib/prisma'
import { CommunityTabs } from '@/components/community/CommunityTabs'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '사역별 커뮤니티 | KIMA' }

export default async function CommunityPage() {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      type: true,
      name: true,
      slug: true,
      order: true,
      flag: true,
      officerName: true,
      officerSns: true,
      officerQr: true,
      createdAt: true,
    },
    orderBy: [{ type: 'asc' }, { order: 'asc' }],
  })

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1B3A6B]">사역별 커뮤니티</h1>
          <p className="mt-2 text-sm text-gray-500">
            지역별·언어권별·사역대상별 카테고리에서 공지와 사역 나눔을 확인하세요
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-gray-400">로딩 중...</div>}>
          <CommunityTabs categories={categories} />
        </Suspense>
      </div>
    </div>
  )
}
