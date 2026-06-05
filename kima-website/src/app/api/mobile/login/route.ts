import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod/v4'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { signAccessToken, signRefreshToken } from '@/lib/mobileAuth'

const bodySchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // IP 기반 Rate Limit (10회/15분) — 웹 로그인과 동일 수준
    const ip = getClientIp(request)
    const { allowed } = checkRateLimit(`mobile-login:${ip}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        expiresAt: true,
        password: true,
        accounts: {
          where: { provider: 'credentials' },
          select: { access_token: true },
          take: 1,
        },
      },
    })

    // 일관된 응답 시간으로 사용자 존재 여부 노출 방지
    const notFoundHash = '$2b$10$invalidhashfortimingnormalization000000000000000000000'
    const hashToCheck = user?.password
      ?? user?.accounts[0]?.access_token
      ?? notFoundHash

    const isValid = await bcrypt.compare(password, hashToCheck)
    if (!user || !isValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      expiresAt: user.expiresAt?.toISOString() ?? null,
    }

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(authUser),
      signRefreshToken(user.id),
    ])

    return NextResponse.json(
      {
        accessToken,
        refreshToken,
        user: authUser,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
