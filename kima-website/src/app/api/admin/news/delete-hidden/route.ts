import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasAdminMenu } from '@/lib/adminAccess'
import { prisma } from '@/lib/prisma'

export async function POST(_request: NextRequest) {
  const session = await auth()
  if (!(await hasAdminMenu(session, 'news'))) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  try {
    const result = await prisma.news.deleteMany({ where: { isVisible: false } })
    return NextResponse.json({ ok: true, deletedCount: result.count })
  } catch {
    return NextResponse.json({ error: '숨김 뉴스 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
