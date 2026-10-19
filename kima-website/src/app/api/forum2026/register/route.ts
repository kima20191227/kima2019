import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { forum2026RegisterSchema } from '@/schemas/forum2026.schema'
import { sendEmail, forum2026RegisteredEmailHtml, forum2026AdminNotifyEmailHtml } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { formatPhone } from '@/lib/utils'
import { FORUM_DAYS, FORUM_INFO, FORUM_KEY, FORUM_LODGING_NIGHTS, isForumRegistrationOpen } from '@/lib/forum2026'

export async function POST(req: NextRequest) {
  // IP당 10분에 5회 신청 시도 제한
  const ip = getClientIp(req)
  const { allowed, resetAt } = checkRateLimit(`forum2026:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  })
  if (!allowed) {
    return NextResponse.json(
      { message: '너무 많은 요청입니다. 잠시 후 다시 시도해 주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    )
  }

  if (!isForumRegistrationOpen()) {
    return NextResponse.json({ message: '신청이 마감되었습니다.' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = forum2026RegisterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: '입력값이 올바르지 않습니다', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const data = parsed.data
    const session = await auth()
    const email = data.email.toLowerCase()
    const phone = formatPhone(data.phone)
    // 정해진 순서로 정렬·중복 제거 (스키마에서 허용값·참석일 포함 여부는 이미 검증)
    const lodgingDays = FORUM_LODGING_NIGHTS.map((n) => n.value).filter((v) => data.lodgingDays.includes(v))
    const mealDays = FORUM_DAYS.map((d) => d.value).filter((v) => data.mealDays.includes(v))

    await prisma.forumRegistration.create({
      data: {
        forumKey: FORUM_KEY,
        name: data.name,
        phone,
        email,
        organization: data.organization,
        position: data.position || null,
        region: data.region || null,
        ministryLanguages: data.ministryLanguages,
        attendDays: data.attendDays,
        lodgingDays,
        mealDays,
        // 구 형식 컬럼 — 날짜별 값과 함께 유지 (기존 조회·통계 호환)
        needsLodging: lodgingDays.length > 0,
        needsMeals: mealDays.length > 0,
        depositorName: data.depositorName,
        depositDate: data.depositDate ? new Date(`${data.depositDate}T00:00:00+09:00`) : null,
        requests: data.requests || null,
        privacyAgreedAt: new Date(),
        userId: session?.user?.id ?? null,
      },
    })

    // 신청 확인 이메일 (실패해도 신청은 완료)
    sendEmail(
      email,
      `[KIMA] ${FORUM_INFO.title} 참가 신청이 접수되었습니다`,
      forum2026RegisteredEmailHtml({
        name: data.name,
        organization: data.organization,
        position: data.position,
        attendDays: data.attendDays,
        lodgingDays,
        mealDays,
        depositorName: data.depositorName,
        depositDate: data.depositDate,
        requests: data.requests,
      })
    ).catch(() => {})

    // 관리자 알림 (ADMIN_EMAIL 설정 시)
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      sendEmail(
        adminEmail,
        `[KIMA] ${FORUM_INFO.title} 신규 신청 — ${data.name}`,
        forum2026AdminNotifyEmailHtml({
          name: data.name,
          organization: data.organization,
          phone,
          depositorName: data.depositorName,
          attendDays: data.attendDays,
          lodgingDays,
          mealDays,
        })
      ).catch(() => {})
    }

    return NextResponse.json({ message: '신청이 완료되었습니다' }, { status: 201 })
  } catch (err: unknown) {
    // 같은 이메일 중복 신청 (unique constraint)
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ message: '이미 신청하셨습니다' }, { status: 409 })
    }
    return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
