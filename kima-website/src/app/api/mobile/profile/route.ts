import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다. Authorization: Bearer <token> 헤더를 포함해주세요.' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        organization: true,
        region: true,
        phone: true,
        position: true,
        denomination: true,
        address: true,
        approvedAt: true,
        expiresAt: true,
        createdAt: true,
        premiumNote: true,
        accounts: {
          select: { provider: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      organization: user.organization,
      region: user.region,
      phone: user.phone,
      position: user.position,
      denomination: user.denomination,
      address: user.address,
      approvedAt: user.approvedAt?.toISOString() ?? null,
      expiresAt: user.expiresAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      premiumNote: user.premiumNote,
      providers: user.accounts.map((a) => a.provider),
    })
  } catch {
    return NextResponse.json(
      { error: '프로필 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
