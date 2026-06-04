import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/email/logs          — 발송 이력 목록 (페이지네이션)
// GET /api/admin/email/logs?id=xxx   — 특정 발송 건 수신자 상세
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id   = searchParams.get('id')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const PAGE_SIZE = 20

    // ── 특정 발송 건의 수신자 상세 조회 ───────────────────────────────────
    if (id) {
      const log = await prisma.emailLog.findUnique({
        where: { id },
        select: {
          id: true, subject: true, targetRole: true,
          totalCount: true, sentCount: true, failedCount: true,
          sentBy: true, createdAt: true,
        },
      })
      if (!log) {
        return NextResponse.json({ error: '이력을 찾을 수 없습니다.' }, { status: 404 })
      }

      const filter = searchParams.get('filter') // 'FAILED' | 'SUCCESS' | null(전체)
      const recipients = await prisma.emailLogRecipient.findMany({
        where: {
          logId: id,
          ...(filter === 'FAILED' || filter === 'SUCCESS' ? { status: filter } : {}),
        },
        orderBy: [{ status: 'asc' }, { email: 'asc' }],
      })

      return NextResponse.json({ log, recipients })
    }

    // ── 이력 목록 (최신순) ────────────────────────────────────────────────
    const [total, logs] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip:  (page - 1) * PAGE_SIZE,
        take:  PAGE_SIZE,
        select: {
          id: true, subject: true, targetRole: true,
          totalCount: true, sentCount: true, failedCount: true,
          sentBy: true, createdAt: true,
        },
      }),
    ])

    return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / PAGE_SIZE) })
  } catch (err) {
    console.error('[email/logs]', err)
    return NextResponse.json({ error: '이력 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
