import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import { sendEmail, eventRegisteredEmailHtml } from '@/lib/email'

const attendSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요').max(50),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  phone: z.string().max(20).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id: eventId } = await params

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json({ error: '존재하지 않는 일정입니다.' }, { status: 404 })
    }
    if (event.scheduledAt < new Date()) {
      return NextResponse.json({ error: '이미 종료된 일정입니다.' }, { status: 400 })
    }

    // 정원 확인
    if (event.maxAttendees) {
      const count = await prisma.eventAttendee.count({ where: { eventId } })
      if (count >= event.maxAttendees) {
        return NextResponse.json({ error: '신청 정원이 마감되었습니다.' }, { status: 409 })
      }
    }

    const body = await request.json()
    const parsed = attendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const attendee = await prisma.eventAttendee.create({
      data: {
        eventId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
      },
    })

    // 신청 확인 이메일 (실패해도 신청은 완료)
    sendEmail(
      parsed.data.email,
      `[KIMA] ${event.title} 참석 신청이 완료되었습니다`,
      eventRegisteredEmailHtml(event.title, event.scheduledAt, event.zoomUrl)
    ).catch(() => {})

    return NextResponse.json({ attendee }, { status: 201 })
  } catch (err: unknown) {
    // 이메일 중복 신청 처리 (unique constraint)
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: '이미 신청하셨습니다.' }, { status: 409 })
    }
    return NextResponse.json({ error: '참석 신청 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
