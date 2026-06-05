/**
 * Expo Push Notifications 발송 유틸리티
 *
 * Expo Push API (https://exp.host/--/api/v2/push/send)를 직접 호출합니다.
 * SDK 없이 fetch만 사용하므로 Edge Runtime에서도 동작합니다.
 *
 * 제약:
 *   - 1회 요청에 최대 100건 (청크 자동 분할)
 *   - 실패 토큰은 로그만 기록 (자동 삭제 미구현 — 향후 receipt 확인 추가 가능)
 */

import { prisma } from '@/lib/prisma'

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type NotifyField = 'notifyPost' | 'notifyEvent' | 'notifyShare'

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default'
  channelId?: string  // Android 채널
  badge?: number
}

// ─── 내부: Expo Push API 호출 ─────────────────────────────────────────────────

async function sendChunk(messages: ExpoPushMessage[]): Promise<void> {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!res.ok) {
      console.error('[expoPush] HTTP 오류:', res.status, await res.text())
      return
    }

    const result = (await res.json()) as {
      data?: Array<{ status: string; message?: string; details?: unknown }>
    }

    // 개별 메시지 실패 로깅
    result.data?.forEach((item, i) => {
      if (item.status === 'error') {
        console.error(
          `[expoPush] 메시지 ${i} 실패:`,
          item.message,
          item.details,
        )
      }
    })
  } catch (err) {
    console.error('[expoPush] 네트워크 오류:', err)
  }
}

// ─── 내부: 토큰 목록 → 실제 발송 ─────────────────────────────────────────────

async function dispatchToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (tokens.length === 0) return

  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title,
    body,
    data,
    sound: 'default',
    channelId: 'kima-default',
  }))

  // Expo 제한: 100건씩 청크 분할
  const CHUNK_SIZE = 100
  const chunks: ExpoPushMessage[][] = []
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    chunks.push(messages.slice(i, i + CHUNK_SIZE))
  }

  await Promise.allSettled(chunks.map(sendChunk))
}

// ─── 공개 함수: 특정 사용자들에게 발송 ───────────────────────────────────────

/**
 * userIds 목록에 속한 사용자 중 해당 알림 유형을 허용한 기기에 발송합니다.
 *
 * @param userIds    발송 대상 userId 배열
 * @param title      알림 제목
 * @param body       알림 본문
 * @param data       딥링크용 페이로드 (type, categoryType, slug, eventId 등)
 * @param notifyField 알림 설정 필터 (notifyPost | notifyEvent | notifyShare)
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
  notifyField?: NotifyField,
): Promise<void> {
  if (userIds.length === 0) return

  const where: Parameters<typeof prisma.devicePushToken.findMany>[0]['where'] =
    {
      userId: { in: userIds },
      ...(notifyField ? { [notifyField]: true } : {}),
    }

  const rows = await prisma.devicePushToken.findMany({
    where,
    select: { token: true },
  })

  await dispatchToTokens(
    rows.map((r) => r.token),
    title,
    body,
    data,
  )
}

// ─── 공개 함수: 전체 앱 사용자에게 브로드캐스트 ──────────────────────────────

/**
 * 앱을 설치한 모든 사용자(= push token이 있는 사용자) 중
 * 해당 알림 유형을 허용한 기기에 발송합니다.
 *
 * @param title      알림 제목
 * @param body       알림 본문
 * @param data       딥링크용 페이로드
 * @param notifyField 알림 설정 필터
 */
export async function sendPushBroadcast(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  notifyField?: NotifyField,
): Promise<void> {
  const where: Parameters<typeof prisma.devicePushToken.findMany>[0]['where'] =
    notifyField ? { [notifyField]: true } : {}

  const rows = await prisma.devicePushToken.findMany({
    where,
    select: { token: true },
  })

  await dispatchToTokens(
    rows.map((r) => r.token),
    title,
    body,
    data,
  )
}
