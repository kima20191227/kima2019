import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const patchSchema = z.object({
  isPublished: z.boolean(),
})

function adminOnly() {
  return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') return adminOnly()

    const { id } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    const updated = await prisma.columnPost.update({
      where: { id },
      data: { isPublished: parsed.data.isPublished },
    })
    return NextResponse.json({ column: updated })
  } catch {
    return NextResponse.json({ error: '칼럼 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') return adminOnly()

    const { id } = await params
    await prisma.columnPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '칼럼 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
