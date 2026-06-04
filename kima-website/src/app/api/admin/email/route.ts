import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { z } from 'zod/v4'
import type { UserRole } from '@prisma/client'

const bodySchema = z.object({
  target: z.enum(['ALL', 'MEMBER', 'PREMIUM', 'OFFICER', 'ADMIN']),
  subject: z.string().min(1, '제목을 입력해주세요.').max(200),
  html: z.string().min(1, '내용을 입력해주세요.'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '최고 관리자만 전체 메일을 발송할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const { target, subject, html } = parsed.data

    // 수신 대상 조회
    const whereRole: UserRole[] =
      target === 'ALL'
        ? ['MEMBER', 'PREMIUM', 'OFFICER', 'ADMIN']
        : [target as UserRole]

    const users = await prisma.user.findMany({
      where: { role: { in: whereRole } },
      select: { email: true, name: true },
    })

    const recipients = users.filter((u) => !!u.email)

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, total: 0, sent: 0, failed: 0, logId: null })
    }

    // ── 발송 이력 레코드 미리 생성 ─────────────────────────────────────────
    const emailLog = await prisma.emailLog.create({
      data: {
        subject,
        targetRole: target,
        totalCount: recipients.length,
        sentCount:  0,
        failedCount: 0,
        sentBy: session.user.email ?? undefined,
      },
    })

    // ── 50명씩 배치 발송 (SMTP 타임아웃 방지) ─────────────────────────────
    const BATCH_SIZE = 50
    let sent = 0
    let failed = 0
    const recipientRows: {
      logId: string
      email: string
      name: string | null
      status: string
      errorMsg: string | null
    }[] = []

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map((user) =>
          sendEmail(user.email!, subject, personalizeHtml(html, user.name))
        )
      )
      results.forEach((r, idx) => {
        const user = batch[idx]
        if (r.status === 'fulfilled') {
          sent++
          recipientRows.push({
            logId: emailLog.id,
            email: user.email!,
            name: user.name,
            status: 'SUCCESS',
            errorMsg: null,
          })
        } else {
          failed++
          const errMsg = r.reason instanceof Error
            ? r.reason.message
            : String(r.reason ?? '알 수 없는 오류')
          recipientRows.push({
            logId: emailLog.id,
            email: user.email!,
            name: user.name,
            status: 'FAILED',
            errorMsg: errMsg.slice(0, 500),
          })
        }
      })
    }

    // ── 수신자별 결과 저장 + 이력 카운트 업데이트 ─────────────────────────
    await Promise.all([
      prisma.emailLogRecipient.createMany({ data: recipientRows }),
      prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { sentCount: sent, failedCount: failed },
      }),
    ])

    return NextResponse.json({ ok: true, total: recipients.length, sent, failed, logId: emailLog.id })
  } catch (err) {
    console.error('[admin/email]', err)
    return NextResponse.json({ error: '메일 발송 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function personalizeHtml(html: string, name: string | null): string {
  return html.replace(/\{\{이름\}\}/g, escapeHtml(name ?? '회원'))
}

// 발송 대상 회원 수 미리보기 (GET)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '최고 관리자만 접근할 수 있습니다.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const target = searchParams.get('target') ?? 'ALL'

    const whereRole: UserRole[] =
      target === 'ALL'
        ? ['MEMBER', 'PREMIUM', 'OFFICER', 'ADMIN']
        : ([target] as UserRole[])

    const count = await prisma.user.count({
      where: { role: { in: whereRole } },
    })

    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
