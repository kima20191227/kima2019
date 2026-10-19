import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { forum2026AdminUpdateSchema } from '@/schemas/forum2026.schema'

function isOfficer(role: string | undefined | null) {
  return role === 'ADMIN' || role === 'OFFICER'
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!isOfficer(session?.user?.role)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = forum2026AdminUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const existing = await prisma.forumRegistration.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: '신청 내역을 찾을 수 없습니다.' }, { status: 404 })
    }

    const registration = await prisma.forumRegistration.update({
      where: { id },
      data: {
        paymentStatus: parsed.data.paymentStatus,
        adminMemo: parsed.data.adminMemo || null,
      },
    })

    return NextResponse.json({ registration })
  } catch {
    return NextResponse.json({ error: '저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
