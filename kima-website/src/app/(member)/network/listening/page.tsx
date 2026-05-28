import Link from 'next/link'
import Image from 'next/image'
import { getEventType } from '@/lib/eventTypes'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ARCHIVE_RECORDS } from '../archive/data'
import { ForumArchiveForm } from '@/components/admin/ForumArchiveForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '리스닝콜 | KIMA',
  description: '전국 이주민 사역자들이 함께 모이는 KIMA 리스닝콜을 소개합니다.',
}

type RecordItem = {
  id: string
  seq: string
  date: string
  title: string
  description: string
  hasContent: boolean
  photo?: string | null
  isPublished: boolean
}

function isOfficer(role?: string | null) {
  return role === 'ADMIN' || role === 'OFFICER'
}

export default async function ListeningCallPage() {
  const session = await auth()
  const canManage = isOfficer(session?.user?.role)

  // DB records — 임원/관리자는 비공개 포함 전체 조회
  const dbRecords = await prisma.forumArchive.findMany({
    where: { type: 'LISTENING_CALL', ...(canManage ? {} : { isPublished: true }) },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, seq: true, date: true, title: true, description: true,
      photos: true, videoUrls: true, isPublished: true,
      _count: { select: { schedules: true, materials: true } },
    },
  }).catch(() => [])

  const dbIds = new Set(dbRecords.map((r) => r.id))

  const fromDB: RecordItem[] = dbRecords.map((r) => ({
    id: r.id, seq: r.seq, date: r.date, title: r.title, description: r.description ?? '',
    hasContent: r._count.schedules > 0 || r._count.materials > 0 || r.photos.length > 0 || r.videoUrls.length > 0,
    photo: r.photos[0] ?? null,
    isPublished: r.isPublished,
  }))

  const fromStatic: RecordItem[] = ARCHIVE_RECORDS
    .filter((r) => r.type === 'LISTENING_CALL' && !dbIds.has(r.id))
    .map((r) => ({
      id: r.id, seq: r.seq, date: r.date, title: r.title, description: r.description,
      hasContent: !!(r.scheduleItems?.length || r.materials?.length || r.photos?.length || r.videoUrl),
      photo: r.photos?.[0] ?? null,
      isPublished: true,
    }))

  const records = [...fromDB, ...fromStatic]
  const typeInfo = getEventType('LISTENING_CALL')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Listening Call</p>
          <h1 className="text-3xl font-bold">리스닝콜</h1>
          <p className="mt-3 text-blue-200">
            전국 이주민 사역자들이 분기마다 모여 현장의 목소리를 나누는 시간
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* 안내 */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-4 text-gray-700 leading-relaxed">
          <h2 className="text-xl font-bold text-[#1B3A6B]">리스닝콜이란?</h2>
          <p>
            리스닝콜(Listening Call)은 KIMA가 분기마다 개최하는 전국 온오프라인 모임입니다.
            각 지역, 언어권, 사역대상의 담당 위원장들이 현장 상황을 공유하고,
            함께 기도하며 연대하는 핵심 프로그램입니다.
          </p>
          <p>
            온라인(Zoom)과 오프라인을 병행하며, 일반회원이면 누구나 신청하실 수 있습니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            {[
              { icon: '🎙', title: '분기별 개최', desc: '1·4·7·10월 정기 개최' },
              { icon: '🌐', title: '온오프라인 병행', desc: 'Zoom + 현장 동시 진행' },
              { icon: '👥', title: '누구나 참여', desc: '일반회원 이상 신청 가능' },
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
              📅 일정 & 참석 신청
            </Link>
          </div>
        </section>

        {/* 역대 리스닝콜 목록 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1B3A6B]">역대 리스닝콜 기록</h2>
            {canManage && (
              <ForumArchiveForm
                mode="create"
                defaultType="LISTENING_CALL"
                triggerLabel="리스닝콜 자료 등록"
              />
            )}
          </div>
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
                      <span className="text-3xl opacity-30">🎙</span>
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
                        {record.hasContent && (
                          <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">자료 있음</span>
                        )}
                        {canManage && !record.isPublished && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">비공개</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm group-hover:text-[#1B3A6B] transition-colors">
                        {record.title}
                      </h3>
                      {record.description && (
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
          <p className="text-center text-xs text-gray-400 pt-6">
            더 이전 기록(1차~9차)은{' '}
            <a href="mailto:kima20191227@gmail.com" className="underline hover:text-gray-600">
              사무국으로 문의
            </a>
            해 주세요.
          </p>
        </section>

      </div>
    </div>
  )
}
