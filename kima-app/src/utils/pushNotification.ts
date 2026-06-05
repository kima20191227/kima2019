/**
 * Expo 푸시 알림 유틸리티
 *
 * 전제: npx expo install expo-device expo-notifications 설치 필요
 *   - expo-device    : 실물 기기 여부 판단
 *   - expo-notifications: 이미 package.json에 포함 (~0.29.9)
 *
 * 흐름:
 *   registerForPushNotifications()
 *     → 권한 요청
 *     → Expo 푸시 토큰 발급
 *     → POST /api/mobile/push-token { token, platform }
 *
 *   unregisterPushToken()
 *     → 로그아웃 시 서버에서 토큰 삭제 (best-effort)
 */

import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform, Alert } from 'react-native'
import { api } from '@/api/client'

// ─── 유형 ─────────────────────────────────────────────────────────────────────

export type Platform_OS = 'ios' | 'android'

// ─── Android 알림 채널 설정 ────────────────────────────────────────────────────

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return

  await Notifications.setNotificationChannelAsync('kima-default', {
    name: 'KIMA 알림',
    description: '공지·행사·사역나눔 알림',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1B3A6B',
    showBadge: true,
  })
}

// ─── Expo 프로젝트 ID 추출 ────────────────────────────────────────────────────

function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Constants as any).easConfig?.projectId ??
    undefined
  )
}

// ─── 공개 함수: 등록 ──────────────────────────────────────────────────────────

/**
 * 권한 요청 → 토큰 발급 → 서버 저장.
 * 로그인 직후 호출하면 됩니다.
 */
export async function registerForPushNotifications(): Promise<void> {
  // 실물 기기 아니면 스킵 (시뮬레이터/에뮬레이터는 지원 안 함)
  if (!Device.isDevice) {
    console.log('[Push] 실물 기기에서만 푸시 토큰을 발급할 수 있습니다.')
    return
  }

  // Android 채널 준비
  await ensureAndroidChannel()

  // 현재 권한 상태 확인
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status

    // OS 다이얼로그가 표시됐는데 거부한 경우에만 안내 표시
    if (finalStatus !== 'granted' && existing === 'undetermined') {
      Alert.alert(
        '알림 권한',
        '알림을 허용하면 새 공지와 행사 소식을 받을 수 있습니다.\n\n알림을 받으려면 기기 설정에서 KIMA 알림을 허용해 주세요.',
        [{ text: '확인' }],
      )
      return
    }

    if (finalStatus !== 'granted') return
  }

  // 토큰 발급
  let token: string
  try {
    const projectId = getProjectId()
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    token = result.data
  } catch (err) {
    // 시뮬레이터 또는 EAS 미설정 환경에서는 무시
    console.warn('[Push] 토큰 발급 실패 (시뮬레이터이거나 EAS 미설정):', err)
    return
  }

  // 서버에 저장 (upsert)
  try {
    await api.post('/api/mobile/push-token', {
      token,
      platform: Platform.OS,
    })
  } catch (err) {
    console.warn('[Push] 토큰 서버 저장 실패:', err)
  }
}

// ─── 공개 함수: 해제 ──────────────────────────────────────────────────────────

/**
 * 로그아웃 전에 호출해 서버에서 이 기기의 토큰을 삭제합니다.
 * best-effort — 실패해도 로그아웃은 진행됩니다.
 */
export async function unregisterPushToken(): Promise<void> {
  if (!Device.isDevice) return

  try {
    const projectId = getProjectId()
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    const token = result.data

    await api.delete(`/api/mobile/push-token?token=${encodeURIComponent(token)}`)
  } catch (err) {
    // 네트워크 오류 또는 시뮬레이터 환경 — 무시
    console.warn('[Push] 토큰 해제 실패 (무시):', err)
  }
}
