import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasAdminMenu } from '@/lib/adminAccess'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'resources'))) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    await prisma.resource.delete({ where: { id } })
    return NextResponse.json({ message: '삭제되었습니다.' })
  } catch {
    return NextResponse.json({ error: '자료 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
