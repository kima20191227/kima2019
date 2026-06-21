import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

export async function POST(_request: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  try {
    const result = await prisma.news.deleteMany({ where: { isVisible: false } })
    return NextResponse.json({ ok: true, deletedCount: result.count })
  } catch {
    return NextResponse.json({ error: '숨김 뉴스 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
