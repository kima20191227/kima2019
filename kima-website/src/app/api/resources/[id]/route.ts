import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resourceSchema } from '@/schemas/resource.schema'
import type { UserRole } from '@prisma/client'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

function hasOwnKey(value: unknown, key: string): boolean {
  return typeof value === 'object'
    && value !== null
    && Object.prototype.hasOwnProperty.call(value, key)
}

function hasManagePermission(
  section: string,
  uploadedById: string | null,
  userId: string,
  role: UserRole,
): boolean {
  if (role === 'ADMIN') return true
  // PUBLIC 섹션: 정회원(PREMIUM) 이상인 작성자만 수정/삭제 가능
  if (section === 'PUBLIC') {
    return uploadedById === userId && (ROLE_WEIGHT[role] ?? 0) >= 2
  }
  // KIMA / MINISTRY 섹션: OFFICER 이상
  return (ROLE_WEIGHT[role] ?? 0) >= 3
}

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { section: true, uploadedById: true },
    })
    if (!resource) {
      return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (!hasManagePermission(resource.section, resource.uploadedById, session.user.id, role)) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    // PATCH는 부분 업데이트 허용
    const parsed = resourceSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const updateData = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => hasOwnKey(body, key)),
    )

    const updated = await prisma.resource.update({
      where: { id },
      data: updateData,
      include: { category: { select: { id: true, name: true, slug: true } } },
    })

    return NextResponse.json({
      resource: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: '자료 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { section: true, uploadedById: true },
    })
    if (!resource) {
      return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (!hasManagePermission(resource.section, resource.uploadedById, session.user.id, role)) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.resource.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '자료 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
