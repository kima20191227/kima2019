import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasAdminMenu } from '@/lib/adminAccess'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  body: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageWidth: z.string().max(20).nullable().optional(),
  youtubeId: z.string().max(20).nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  linkLabel: z.string().max(50).nullable().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
})

async function requireAdmin() {
  const session = await auth()
  return hasAdminMenu(session, 'popups')
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }
    const { startAt, endAt, ...rest } = parsed.data
    const popup = await prisma.popup.update({
      where: { id },
      data: {
        ...rest,
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : {}),
      },
    })
    return NextResponse.json({ popup })
  } catch {
    return NextResponse.json({ error: '팝업 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!await requireAdmin()) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }
    const { id } = await params
    await prisma.popup.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '팝업 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
