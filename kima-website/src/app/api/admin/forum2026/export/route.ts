import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FORUM_DAYS, FORUM_KEY } from '@/lib/forum2026'
import { FORUM_PAYMENT_STATUSES } from '@/schemas/forum2026.schema'
import type { ForumPaymentStatus } from '@prisma/client'

const STATUS_LABELS: Record<ForumPaymentStatus, string> = {
  PENDING: '입금대기',
  CONFIRMED: '입금확인',
  CANCELLED: '취소',
}

function isOfficer(role: string | undefined | null) {
  return role === 'ADMIN' || role === 'OFFICER'
}

// CSV 셀 이스케이프 + 수식 주입(=,+,-,@) 방지
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

function formatKst(date: Date | null, withTime = false) {
  if (!date) return ''
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  })
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!isOfficer(session?.user?.role)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const statusParam = request.nextUrl.searchParams.get('status')
    const status = FORUM_PAYMENT_STATUSES.find((s) => s === statusParam)

    const rows = await prisma.forumRegistration.findMany({
      where: { forumKey: FORUM_KEY, ...(status ? { paymentStatus: status } : {}) },
      orderBy: { createdAt: 'asc' },
    })

    const header = [
      '신청일시', '이름', '휴대폰', '이메일', '소속', '직분', '사역지역', '사역언어권',
      ...FORUM_DAYS.map((d) => d.label),
      '숙박', '식사', '입금자명', '입금예정일', '입금상태', '요청사항', '관리메모',
    ]

    const lines = rows.map((r) =>
      [
        formatKst(r.createdAt, true),
        r.name,
        r.phone,
        r.email,
        r.organization,
        r.position ?? '',
        r.region ?? '',
        r.ministryLanguages.join(', '),
        ...FORUM_DAYS.map((d) => (r.attendDays.includes(d.value) ? 'O' : '')),
        r.needsLodging ? 'O' : 'X',
        r.needsMeals ? 'O' : 'X',
        r.depositorName,
        formatKst(r.depositDate),
        STATUS_LABELS[r.paymentStatus],
        r.requests ?? '',
        r.adminMemo ?? '',
      ].map(csvCell).join(',')
    )

    // UTF-8 BOM — Excel에서 한글 깨짐 방지
    const csv = '﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n')
    const filename = encodeURIComponent(`2026_KIMA_포럼_신청자${status ? `_${STATUS_LABELS[status]}` : ''}.csv`)

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="forum2026.csv"; filename*=UTF-8''${filename}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'CSV 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
