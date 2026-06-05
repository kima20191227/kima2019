import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { RequireRole } from '@/auth/RequireRole'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorView } from '@/components/ui/ErrorView'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import type { Event } from '@/types'

// ─── 리스닝콜 카드 ────────────────────────────────────────────────────────────

function ListeningCallCard({
  event,
  isAuthenticated,
}: {
  event: Event
  isAuthenticated: boolean
}) {
  const date = new Date(event.scheduledAt)
  const isPast = date < new Date()
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const handleJoinZoom = async () => {
    if (event.zoomUrl && isAuthenticated) {
      await WebBrowser.openBrowserAsync(event.zoomUrl)
    }
  }

  return (
    <View
      className={`bg-white rounded-2xl shadow-sm mb-4 overflow-hidden ${
        isPast ? 'opacity-60' : ''
      }`}
    >
      {/* D-day 배너 */}
      {!isPast && daysLeft <= 7 && (
        <View className="bg-secondary px-4 py-1.5">
          <Text className="text-white text-xs font-semibold text-center">
            {daysLeft === 0 ? '🔴 오늘입니다!' : `🔔 D-${daysLeft}`}
          </Text>
        </View>
      )}

      <View className="p-4">
        {/* 날짜 + 타입 */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className={`px-2.5 py-1 rounded-full ${isPast ? 'bg-gray-100' : 'bg-primary'}`}>
            <Text className={`text-xs font-medium ${isPast ? 'text-gray-500' : 'text-white'}`}>
              {isPast ? '종료' : '리스닝콜'}
            </Text>
          </View>
          <Text className="text-gray-400 text-xs">
            {date.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </Text>
        </View>

        {/* 제목 */}
        <Text className="text-gray-900 font-bold text-base mb-1">{event.title}</Text>
        {event.description && (
          <Text className="text-gray-500 text-sm leading-relaxed" numberOfLines={3}>
            {event.description}
          </Text>
        )}

        {/* 시간 + 참석자 */}
        <View className="flex-row items-center gap-4 mt-3">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-gray-400 text-xs">🕐</Text>
            <Text className="text-gray-600 text-sm">
              {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          {event.maxAttendees && (
            <View className="flex-row items-center gap-1.5">
              <Text className="text-gray-400 text-xs">👥</Text>
              <Text className="text-gray-600 text-sm">최대 {event.maxAttendees}명</Text>
            </View>
          )}
        </View>

        {/* Zoom 링크 */}
        {!isPast && event.zoomUrl && isAuthenticated && (
          <TouchableOpacity
            onPress={handleJoinZoom}
            className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex-row items-center gap-3"
          >
            <Text className="text-xl">💻</Text>
            <View className="flex-1">
              <Text className="text-blue-700 font-semibold text-sm">Zoom으로 참여하기</Text>
              <Text className="text-blue-400 text-xs mt-0.5" numberOfLines={1}>
                {event.zoomUrl}
              </Text>
            </View>
            <Text className="text-blue-400 text-sm">→</Text>
          </TouchableOpacity>
        )}

        {/* 참석 신청 버튼 */}
        {!isPast && (
          <TouchableOpacity
            onPress={() => router.push(`/(public)/events/${event.id}` as never)}
            className="mt-3 border border-primary py-2.5 rounded-xl items-center"
          >
            <Text className="text-primary text-sm font-medium">참석 신청하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ─── 리스닝콜 소개 ────────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <View className="mx-4 mb-5 bg-primary rounded-2xl p-5">
      <Text className="text-secondary font-bold text-xs tracking-widest uppercase mb-2">
        Listening Call
      </Text>
      <Text className="text-white font-bold text-lg leading-snug mb-2">
        리스닝콜이란?
      </Text>
      <Text className="text-blue-200 text-sm leading-relaxed">
        KIMA의 분기별 온라인 연합 모임입니다.{'\n'}
        전국 사역자들이 화상으로 연결되어 현장 이야기를 나누고,
        서로의 사역을 위해 기도하며 협력 방안을 모색합니다.
      </Text>

      <View className="flex-row gap-4 mt-4">
        {[
          { value: '분기 1회', label: '개최 주기' },
          { value: '온라인', label: '참여 방법' },
          { value: 'Zoom', label: '플랫폼' },
        ].map((stat) => (
          <View key={stat.label} className="flex-1 items-center">
            <Text className="text-white font-bold text-sm">{stat.value}</Text>
            <Text className="text-blue-300 text-xs mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

function NetworkContent() {
  const { isAuthenticated } = useAuth()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', 'LISTENING_CALL'],
    queryFn: () =>
      api.get<Event[] | { data: Event[] }>('/api/events', { type: 'LISTENING_CALL' }),
    select: (d) => (Array.isArray(d) ? d : (d as { data?: Event[] }).data ?? []),
  })

  const events = data ?? []
  const upcoming = events.filter((e) => new Date(e.scheduledAt) >= new Date())
  const past     = events.filter((e) => new Date(e.scheduledAt) <  new Date())
  const sorted   = [...upcoming, ...past]

  return (
    <>
      <Stack.Screen options={{ title: '리스닝콜 네트워크', headerShown: true }} />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <ScrollView>
            <View className="h-5" />
            <View className="mx-4"><SkeletonList count={3} /></View>
          </ScrollView>
        ) : isError ? (
          <ErrorView onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
            ListHeaderComponent={<AboutSection />}
            ListEmptyComponent={
              <EmptyState
                emoji="📅"
                title="예정된 리스닝콜이 없습니다"
                message="다음 일정이 등록되면 알려드리겠습니다."
              />
            }
            renderItem={({ item }) => (
              <View className="mx-4">
                <ListeningCallCard event={item} isAuthenticated={isAuthenticated} />
              </View>
            )}
          />
        )}
      </View>
    </>
  )
}

export default function NetworkScreen() {
  return (
    <RequireRole minRole="MEMBER">
      <NetworkContent />
    </RequireRole>
  )
}
