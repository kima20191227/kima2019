import Link from 'next/link'
import Image from 'next/image'
import { getEventType } from '@/lib/eventTypes'
import { prisma } from '@/lib/prisma'
import { ARCHIVE_RECORDS } from '../archive/data'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'KIMA 포럼 | KIMA',
  description: 'KIMA 이주민 선교 포럼을 소개합니다.',
}

type RecordItem = {
  id: string
  seq: string
  date: string
  title: string
  description: string
  location?: string | null
  theme?: string | null
  hasContent: boolean
  photo?: string | null
}

export default async function ForumPage() {
  // DB records (FORUM, published)
  const dbRecords = await prisma.forumArchive.findMany({
    where: { type: 'FORUM', isPublished: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, seq: true, date: true, title: true, description: true, location: true, theme: true,
      photos: true, videoUrls: true,
      _count: { select: { schedules: true, materials: true } },
    },
  }).catch(() => [])

  const dbIds = new Set(dbRecords.map((r) => r.id))

  const fromDB: RecordItem[] = dbRecords.map((r) => ({
    id: r.id, seq: r.seq, date: r.date, title: r.title, description: r.description ?? '',
    location: r.location, theme: r.theme,
    hasContent: r._count.schedules > 0 || r._count.materials > 0 || r.photos.length > 0 || r.videoUrls.length > 0,
    photo: r.photos[0] ?? null,
  }))

  const fromStatic: RecordItem[] = ARCHIVE_RECORDS
    .filter((r) => r.type === 'FORUM' && !dbIds.has(r.id))
    .map((r) => ({
      id: r.id, seq: r.seq, date: r.date, title: r.title, description: r.description,
      location: r.location, theme: r.theme,
      hasContent: !!(r.scheduleItems?.length || r.materials?.length || r.photos?.length || r.videoUrl),
      photo: r.photos?.[0] ?? null,
    }))

  const records = [...fromDB, ...fromStatic]
  const typeInfo = getEventType('FORUM')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Forum</p>
          <h1 className="text-3xl font-bold">KIMA 포럼</h1>
          <p className="mt-3 text-blue-200">
            이주민 사역 전문가들이 함께 모이는 연합 포럼
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* 안내 */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-4 text-gray-700 leading-relaxed">
          <h2 className="text-xl font-bold text-[#1B3A6B]">KIMA 포럼이란?</h2>
          <p>
            KIMA 포럼은 연 1회 개최되는 대규모 이주민 선교 연합 집회입니다.
            이주민 사역 전문가 초청 강의, 지역별 사역 발표, 워크숍 등
            깊이 있는 배움과 교제의 시간으로 구성됩니다.
          </p>
          <p>
            전국의 이주민 사역자들이 한자리에 모여 현장의 경험을 나누고,
            하나님의 선교를 함께 점검하는 소중한 자리입니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            {[
              { icon: '🏛', title: '연 1회 개최', desc: '매년 12월 정기 포럼' },
              { icon: '🎤', title: '전문가 강의', desc: '이주민 사역 전문가 초청' },
              { icon: '🤝', title: '연합 교제', desc: '전국 사역자 네트워킹' },
            ].map((item) => (
              <div key={item.title} className="bg-[#F8F9FA] rounded-xl p-5 text-center">
                <span className="text-3xl">{item.icon}</span>
                <p className="font-semibold text-gray-800 mt-2">{item.title}</p>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Link
              href="/network/schedule"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#142d54] transition-colors"
            >
              📅 KIMA 행사 일정
            </Link>
          </div>
        </section>

        {/* 역대 포럼 목록 */}
        <section>
          <h2 className="text-lg font-bold text-[#1B3A6B] mb-4">역대 포럼 기록</h2>
          {records.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
              등록된 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <Link
                  key={record.id}
                  href={`/network/archive/${record.id}`}
                  className="flex items-stretch gap-0 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#C8922A] transition-all group overflow-hidden"
                >
                  {/* 썸네일 */}
                  {record.photo ? (
                    <div className="w-28 sm:w-36 shrink-0 relative overflow-hidden">
                      <Image
                        src={record.photo}
                        alt={record.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-28 sm:w-36 shrink-0 bg-[#1B3A6B]/5 flex items-center justify-center">
                      <span className="text-3xl opacity-30">🏛</span>
                    </div>
                  )}

                  {/* 텍스트 */}
                  <div className="flex flex-1 items-start gap-3 p-4 min-w-0">
                    <div className="shrink-0 pt-0.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-[#C8922A] font-bold">{record.seq}</span>
                        <span className="text-xs text-gray-400">{record.date}</span>
                        {record.location && (
                          <span className="text-xs text-gray-400">📍 {record.location}</span>
                        )}
                        {record.hasContent && (
                          <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">자료 있음</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm group-hover:text-[#1B3A6B] transition-colors">
                        {record.title}
                      </h3>
                      {record.theme && (
                        <p className="text-xs text-[#1B3A6B]/70 mt-0.5 font-medium">{record.theme}</p>
                      )}
                      {!record.theme && record.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{record.description}</p>
                      )}
                    </div>
                    <div className="shrink-0 self-center text-gray-300 group-hover:text-[#C8922A] transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
