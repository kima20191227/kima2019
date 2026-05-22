import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resourceSchema } from '@/schemas/resource.schema'
import type { UserRole } from '@prisma/client'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { uploadedById: true },
    })
    if (!resource) {
      return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    const roleWeight = ROLE_WEIGHT[session.user.role as UserRole] ?? 0
    const isUploader = resource.uploadedById === session.user.id
    const isOfficerOrAbove = roleWeight >= 3

    if (!isUploader && !isOfficerOrAbove) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = resourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const updated = await prisma.resource.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        driveUrl: parsed.data.driveUrl,
        fileType: parsed.data.fileType ?? null,
        accessLevel: parsed.data.accessLevel,
        categoryId: parsed.data.categoryId ?? null,
      },
    })

    return NextResponse.json({ resource: updated })
  } catch {
    return NextResponse.json({ error: '자료 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
      select: { uploadedById: true },
    })
    if (!resource) {
      return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 })
    }

    const roleWeight = ROLE_WEIGHT[session.user.role as UserRole] ?? 0
    const isUploader = resource.uploadedById === session.user.id
    const isOfficerOrAbove = roleWeight >= 3

    if (!isUploader && !isOfficerOrAbove) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.resource.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '자료 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
