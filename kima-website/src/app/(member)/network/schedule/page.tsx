import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '일정 & 참석 신청 | KIMA' }

export default async function NetworkSchedulePage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  // Load upcoming + recent past events for the calendar (next 12 months + past 2 months)
  const twoMonthsAgo = new Date()
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

  const events = await prisma.event.findMany({
    where: { scheduledAt: { gte: twoMonthsAgo } },
    include: { _count: { select: { attendees: true } } },
    orderBy: { scheduledAt: 'asc' },
  }).catch(() => [])

  const userRole = (session?.user?.role ?? null) as string | null

  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    scheduledAt: e.scheduledAt.toISOString(),
    description: e.description,
    location: e.location ?? null,
    zoomUrl: isLoggedIn ? (e.zoomUrl ?? null) : null,
    maxAttendees: e.maxAttendees,
    attendeeCount: e._count.attendees,
  }))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Schedule</p>
          <h1 className="text-2xl font-bold">예정 일정 & 참석 신청</h1>
          <p className="mt-2 text-blue-200 text-sm">
            리스닝콜·포럼 일정을 확인하고 참석을 신청하세요.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ScheduleCalendar events={calendarEvents} isLoggedIn={isLoggedIn} userRole={userRole} />
      </div>
    </div>
  )
}
