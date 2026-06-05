import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, eventReminderEmailHtml } from '@/lib/email'
import { sendPushToUsers } from '@/lib/expoPush'

// 매일 KST 09:00 (UTC 00:00) 실행
// 3일 후 예정된 행사의 신청자에게 이메일 + 앱 푸시 리마인더 발송
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  // CRON_SECRET 미설정 시 누구나 호출 가능한 버그 방지 — 환경변수 필수
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const now = new Date()
    // 3일 후 당일 범위 (KST 기준 오전 00:00 ~ 23:59)
    const in3Days = new Date(now)
    in3Days.setDate(in3Days.getDate() + 3)
    const dayStart = new Date(in3Days)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(in3Days)
    dayEnd.setHours(23, 59, 59, 999)

    const events = await prisma.event.findMany({
      where: { scheduledAt: { gte: dayStart, lte: dayEnd } },
      include: { attendees: { select: { name: true, email: true } } },
    })

    let emailSent = 0
    let pushSent = 0

    await Promise.allSettled(
      events.map(async (event) => {
        // 1) 이메일 발송
        await Promise.allSettled(
          event.attendees.map(async (attendee) => {
            await sendEmail(
              attendee.email,
              `[KIMA] ${event.title} — 3일 전 리마인더`,
              eventReminderEmailHtml(event.title, event.scheduledAt, event.zoomUrl),
            )
            emailSent++
          }),
        )

        // 2) 앱 푸시 알림 발송 — 신청자 이메일로 userId 조회
        const attendeeEmails = event.attendees.map((a) => a.email)
        if (attendeeEmails.length === 0) return

        const users = await prisma.user.findMany({
          where: { email: { in: attendeeEmails } },
          select: { id: true },
        })

        if (users.length === 0) return

        const userIds = users.map((u) => u.id)

        const scheduledDate = event.scheduledAt.toLocaleDateString('ko-KR', {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        })

        await sendPushToUsers(
          userIds,
          `📅 ${event.title} — 3일 전`,
          `${scheduledDate}에 예정된 행사입니다. 참석 준비 확인해 주세요.`,
          {
            type: 'event',
            eventId: event.id,
          },
          'notifyEvent',
        )

        pushSent += userIds.length
      }),
    )

    return NextResponse.json({
      ok: true,
      events: events.length,
      emailSent,
      pushSent,
    })
  } catch (err) {
    console.error('[cron/event-reminders]', err)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
