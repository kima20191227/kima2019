import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resourceSchema } from '@/schemas/resource.schema'
import type { UserRole, AccessLevel } from '@prisma/client'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

function getAllowedLevels(role?: UserRole, expiresAt?: Date | null): AccessLevel[] {
  const weight = role ? (ROLE_WEIGHT[role] ?? 0) : 0
  // PREMIUM 역할이어도 만료된 경우 MEMBER 수준으로 강등
  const effectiveWeight =
    role === 'PREMIUM' && expiresAt && expiresAt < new Date() ? 1 : weight
  if (effectiveWeight >= 2) return ['PUBLIC', 'MEMBER', 'PREMIUM']
  if (effectiveWeight >= 1) return ['PUBLIC', 'MEMBER']
  return ['PUBLIC']
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role as UserRole | undefined

    // PREMIUM 역할인 경우 만료 여부를 DB에서 확인
    let expiresAt: Date | null = null
    if (role === 'PREMIUM' && session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { expiresAt: true },
      })
      expiresAt = user?.expiresAt ?? null
    }

    const allowedLevels = getAllowedLevels(role, expiresAt)

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    const resources = await prisma.resource.findMany({
      where: {
        accessLevel: { in: allowedLevels },
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ resources })
  } catch {
    return NextResponse.json({ error: '자료를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const role = session.user.role as UserRole
    if (ROLE_WEIGHT[role] < 1) {
      return NextResponse.json({ error: '로그인 회원만 자료를 등록할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = resourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const resource = await prisma.resource.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        driveUrl: parsed.data.driveUrl,
        fileType: parsed.data.fileType ?? null,
        accessLevel: parsed.data.accessLevel,
        categoryId: parsed.data.categoryId ?? null,
        uploadedById: session.user.id,
      },
    })

    return NextResponse.json({ resource }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '자료 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
