import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  const body = await request.json()
  const parsed = bulkDeleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }
  try {
    const result = await prisma.news.deleteMany({ where: { id: { in: parsed.data.ids } } })
    return NextResponse.json({ ok: true, deletedCount: result.count })
  } catch {
    return NextResponse.json({ error: '뉴스 일괄 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
