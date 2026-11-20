import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ADMIN_MENU_KEYS } from '@/lib/adminAccess'

const bodySchema = z.object({
  menus: z.array(z.enum(ADMIN_MENU_KEYS, { message: '허용되지 않는 메뉴입니다.' })).max(ADMIN_MENU_KEYS.length),
})

// PATCH /api/admin/members/[id]/menus — 임원(OFFICER)에게 관리자 메뉴 권한 부여·회수 (ADMIN 전용)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    // 권한 부여는 ADMIN만 가능하다. 임원이 자기 권한을 늘리는 것을 막기 위해 개별 부여 대상이 아니다.
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const { id } = await params
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } })
    if (!target) return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 })
    if (target.role !== 'OFFICER') {
      return NextResponse.json({ error: '임원 등급 회원에게만 부여할 수 있습니다.' }, { status: 400 })
    }

    const menus = [...new Set(parsed.data.menus)]
    await prisma.user.update({ where: { id }, data: { adminMenus: menus } })
    return NextResponse.json({ menus })
  } catch {
    return NextResponse.json({ error: '권한 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
