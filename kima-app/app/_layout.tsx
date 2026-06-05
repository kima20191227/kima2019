import '../global.css'

import React, { useEffect, useRef } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { ActivityIndicator, View } from 'react-native'
import * as Notifications from 'expo-notifications'
import { registerForPushNotifications } from '@/utils/pushNotification'

// ─── 포그라운드 알림 핸들러 (모듈 레벨 — 앱이 열려있어도 알림 표시) ──────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// ─── 알림 탭 딥링크 핸들러 ───────────────────────────────────────────────────

type NotificationData = {
  type?: string
  categoryType?: string
  slug?: string
  postId?: string
  eventId?: string
}

function handleNotificationTap(data: NotificationData): void {
  if (!data?.type) return

  if (data.type === 'post' && data.categoryType && data.slug) {
    router.push(
      `/(member)/community/${data.categoryType}/${data.slug}` as never,
    )
  } else if (data.type === 'event' && data.eventId) {
    router.push(`/(public)/events/${data.eventId}` as never)
  }
}

// ─── queryClient (싱글톤) ─────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

// ─── 루트 네비게이터 ──────────────────────────────────────────────────────────

function RootLayoutNav() {
  const { isLoading, user } = useAuth()
  const prevUserIdRef = useRef<string | null>(null)

  // 알림 수신 리스너 (포그라운드)
  useEffect(() => {
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        // setNotificationHandler가 표시 처리 — 여기서는 로깅만
        console.log(
          '[Push] 포그라운드 수신:',
          notification.request.content.title,
        )
      },
    )

    // 알림 탭 리스너 (백그라운드·종료 상태에서 앱 열기)
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content
          .data as NotificationData
        handleNotificationTap(data)
      },
    )

    // 앱이 알림으로 실행된 경우 처리 (killed → opened)
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return
        const data = response.notification.request.content
          .data as NotificationData
        handleNotificationTap(data)
      })
      .catch(() => {})

    return () => {
      foregroundSub.remove()
      tapSub.remove()
    }
  }, [])

  // 로그인 시 푸시 토큰 자동 등록
  useEffect(() => {
    const currentId = user?.id ?? null

    if (currentId && currentId !== prevUserIdRef.current) {
      // 로그인 → 1.5초 뒤 권한 요청 (로그인 애니메이션과 겹치지 않게)
      prevUserIdRef.current = currentId
      const timer = setTimeout(() => {
        registerForPushNotifications().catch(console.error)
      }, 1500)
      return () => clearTimeout(timer)
    }

    if (!currentId) {
      prevUserIdRef.current = null
    }
  }, [user?.id])

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1B3A6B" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(member)" />
      <Stack.Screen name="(premium)" />
      <Stack.Screen
        name="auth/login"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="auth/register"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  )
}

// ─── 루트 레이아웃 ────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <StatusBar style="auto" />
          <OfflineBanner />
          <RootLayoutNav />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
