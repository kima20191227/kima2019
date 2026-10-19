import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  buildForumAdminWhere,
  filterForumRowsByStay,
  FORUM_EXPORT_COLUMNS,
  FORUM_STATUS_LABELS,
  parseForumAdminFilters,
} from '@/lib/forum2026Admin'
import { forum2026ExportColsSchema } from '@/schemas/forum2026.schema'

function isOfficer(role: string | undefined | null) {
  return role === 'ADMIN' || role === 'OFFICER'
}

// CSV 셀 이스케이프 + 수식 주입(=,+,-,@) 방지
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!isOfficer(session?.user?.role)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const colsParsed = forum2026ExportColsSchema.safeParse(searchParams.getAll('cols'))
    if (!colsParsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: colsParsed.error.format() },
        { status: 400 }
      )
    }
    const columns = colsParsed.data.map((key) => FORUM_EXPORT_COLUMNS[key])
    const filters = parseForumAdminFilters(Object.fromEntries(searchParams))

    const rows = filterForumRowsByStay(
      await prisma.forumRegistration.findMany({
        where: buildForumAdminWhere(filters),
        orderBy: { createdAt: 'asc' },
      }),
      filters
    )

    const header = columns.flatMap((c) => c.headers)
    const lines = rows.map((r) => columns.flatMap((c) => c.cells(r)).map(csvCell).join(','))

    // UTF-8 BOM — Excel에서 한글 깨짐 방지
    const csv = '﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n')
    const status = filters.status
    const filename = encodeURIComponent(`2026_KIMA_포럼_신청자${status ? `_${FORUM_STATUS_LABELS[status]}` : ''}.csv`)

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
