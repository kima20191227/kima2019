import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEventType } from '@/lib/eventTypes'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id }, select: { title: true } }).catch(() => null)
  return { title: event ? `${event.title} | KIMA 일정` : '일정 상세 | KIMA' }
}

export default async function EventDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [session, event] = await Promise.all([
    auth(),
    prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { attendees: true } } },
    }).catch(() => null),
  ])

  if (!event) notFound()

  const isLoggedIn  = !!session?.user
  const isPast      = event.scheduledAt < new Date()
  const isFull      = event.maxAttendees != null && event._count.attendees >= event.maxAttendees
  const eventType   = getEventType(event.type)

  const dateStr = event.scheduledAt.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
  const timeStr = event.scheduledAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 배너 */}
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/network/schedule"
            className="inline-flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4 transition-colors"
          >
            ← 일정 목록
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${eventType.color}`}>
              {eventType.label}
            </span>
            {isPast && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
                종료
              </span>
            )}
            {!isPast && isFull && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                마감
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-snug">{event.title}</h1>
        </div>
      </div>

      {/* 상세 내용 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* 일정 정보 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">일정 정보</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 날짜·시간 */}
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📅</span>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">날짜</p>
                <p className="font-semibold text-[#1A1A1A] text-sm">{dateStr}</p>
                <p className="text-sm text-gray-600">{timeStr}</p>
              </div>
            </div>

            {/* 장소 */}
            {event.location && (
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">📍</span>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">장소</p>
                  <p className="font-semibold text-[#1A1A1A] text-sm">{event.location}</p>
                </div>
              </div>
            )}

            {/* 참석 인원 */}
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">👥</span>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">참석 현황</p>
                <p className="font-semibold text-[#1A1A1A] text-sm">
                  {event._count.attendees}명
                  {event.maxAttendees ? ` / 정원 ${event.maxAttendees}명` : ' (정원 무제한)'}
                </p>
                {event.maxAttendees && (
                  <div className="mt-1.5 w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1B3A6B] rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((event._count.attendees / event.maxAttendees) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Zoom 링크 */}
            {event.zoomUrl && (
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🎥</span>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">온라인 참여</p>
                  {isLoggedIn ? (
                    <a
                      href={event.zoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Zoom 링크 열기 →
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">
                      로그인 후 확인 가능합니다.{' '}
                      <Link href="/auth/login" className="text-[#1B3A6B] hover:underline">로그인</Link>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 설명 */}
        {event.description && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">내용</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-3">
          {!isPast && !isFull && (
            <Link
              href={`/network/schedule/${event.id}/attend`}
              className="px-6 py-3 rounded-xl bg-[#1B3A6B] text-white font-semibold hover:bg-[#142d54] transition-colors text-sm"
            >
              참석 신청하기
            </Link>
          )}
          {!isPast && isFull && (
            <span className="px-6 py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm">
              정원이 마감되었습니다
            </span>
          )}
          {isPast && (
            <span className="px-6 py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm">
              종료된 일정입니다
            </span>
          )}
          <Link
            href="/network/schedule"
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            ← 목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}
