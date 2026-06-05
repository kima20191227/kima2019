import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'

/**
 * POST /api/mobile/push-token
 * Body: { token: string, platform: string }
 *
 * 같은 토큰이 있으면 userId를 업데이트 (다른 계정으로 재로그인 대응)
 * 없으면 새로 생성
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { token, platform } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'token 값이 필요합니다.' },
        { status: 400 },
      )
    }

    await prisma.devicePushToken.upsert({
      where: { token },
      create: {
        userId: authUser.id,
        token,
        platform: platform ?? 'unknown',
      },
      update: {
        userId: authUser.id,
        platform: platform ?? 'unknown',
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: '토큰 저장 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/mobile/push-token?token=ExponentPushToken[...]
 *
 * 로그아웃 시 해당 기기의 토큰을 삭제합니다.
 * 본인 토큰인지 확인 후 삭제합니다.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ ok: true }) // 토큰 없으면 no-op
    }

    // 본인 토큰만 삭제 가능
    await prisma.devicePushToken.deleteMany({
      where: { token, userId: authUser.id },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: '토큰 삭제 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
