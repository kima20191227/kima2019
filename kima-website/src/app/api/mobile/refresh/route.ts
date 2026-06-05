import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { verifyToken, signAccessToken, signRefreshToken } from '@/lib/mobileAuth'

const bodySchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken이 필요합니다.'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'refreshToken이 필요합니다.' },
        { status: 400 }
      )
    }

    // Refresh Token 남용 방지: IP당 30회/15분
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`mobile-refresh:${ip}`, {
      limit: 30,
      windowMs: 15 * 60 * 1000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    const payload = await verifyToken(parsed.data.refreshToken)
    if (!payload || payload.type !== 'refresh' || !payload.userId) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 refreshToken입니다.' },
        { status: 401 }
      )
    }

    // DB에서 최신 사용자 정보 조회 (역할 변경 즉시 반영)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        expiresAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt: user.expiresAt?.toISOString() ?? null,
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(authUser),
      signRefreshToken(user.id),
    ])

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: authUser,
    })
  } catch {
    return NextResponse.json(
      { error: '토큰 갱신 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
