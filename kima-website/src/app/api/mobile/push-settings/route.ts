import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/mobileAuth'

/**
 * GET /api/mobile/push-settings
 *
 * 이 사용자의 알림 설정을 반환합니다.
 * 등록된 토큰이 없으면 기본값(전체 true)과 hasToken: false를 반환합니다.
 * 설정은 사용자 단위로 모든 기기에 동기화됩니다 (첫 번째 토큰 기준).
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const token = await prisma.devicePushToken.findFirst({
      where: { userId: authUser.id },
      select: { notifyPost: true, notifyEvent: true, notifyShare: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      notifyPost:  token?.notifyPost  ?? true,
      notifyEvent: token?.notifyEvent ?? true,
      notifyShare: token?.notifyShare ?? true,
      hasToken: token !== null,
    })
  } catch {
    return NextResponse.json(
      { error: '설정 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/mobile/push-settings
 * Body: { notifyPost?: boolean, notifyEvent?: boolean, notifyShare?: boolean }
 *
 * 이 사용자의 모든 기기(토큰)에 동일하게 설정을 업데이트합니다.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const { notifyPost, notifyEvent, notifyShare } = body

    // 전달된 필드만 업데이트 (undefined는 무시)
    const updateData: Record<string, boolean> = {}
    if (typeof notifyPost  === 'boolean') updateData.notifyPost  = notifyPost
    if (typeof notifyEvent === 'boolean') updateData.notifyEvent = notifyEvent
    if (typeof notifyShare === 'boolean') updateData.notifyShare = notifyShare

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '변경할 설정 값이 없습니다.' },
        { status: 400 },
      )
    }

    // 이 사용자의 모든 토큰(기기)에 동기화
    await prisma.devicePushToken.updateMany({
      where: { userId: authUser.id },
      data: updateData,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: '설정 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
