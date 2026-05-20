import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '중보기도 요청 | KIMA' }

export default async function PrayerPage() {
  const session = await auth()

  const prayers = await prisma.story.findMany({
    where: {
      type: 'PRAYER_REQUEST',
      isPublished: true,
      status: 'APPROVED',
      OR: [
        { visibility: 'PUBLIC' },
        ...(session ? [{ visibility: 'MEMBER' as const }] : []),
        ...(session?.user?.role === 'ADMIN' || session?.user?.role === 'OFFICER'
          ? [{ visibility: 'PRAYER_TEAM' as const }]
          : []),
      ],
    },
    orderBy: [
      { urgency: 'asc' },
      { createdAt: 'desc' },
    ],
  }).catch(() => [])

  const urgent = prayers.filter((p) => p.urgency === 'URGENT')
  const normal = prayers.filter((p) => p.urgency !== 'URGENT')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Prayer</p>
            <h1 className="text-2xl font-bold">중보기도 요청</h1>
            <p className="mt-2 text-blue-200 text-sm">함께 기도해 주세요. 기도가 현장을 바꿉니다.</p>
          </div>
          <Link
            href="/story/prayer/write"
            className="shrink-0 px-4 py-2 bg-[#C8922A] text-white text-sm font-semibold rounded-lg hover:bg-[#b07d22] transition-colors"
          >
            기도 요청하기
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* 긴급 기도 */}
        {urgent.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              긴급 기도 요청
            </h2>
            <div className="space-y-3">
              {urgent.map((item) => (
                <div key={item.id} className="bg-white border-l-4 border-red-400 rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    {item.isAnswered && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                        응답됨
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {item.requesterName ?? '익명'} · {item.createdAt.toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 일반 기도 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">기도 요청</h2>
          {normal.length === 0 && urgent.length === 0 ? (
            <p className="text-center text-gray-400 py-10">등록된 기도 요청이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {normal.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800">{item.title}</h3>
                    {item.isAnswered && (
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                        응답됨
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {item.requesterName ?? '익명'} · {item.createdAt.toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
