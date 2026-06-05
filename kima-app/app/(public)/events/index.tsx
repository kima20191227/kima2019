import React from 'react'
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { api } from '@/api/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Event } from '@/types'

function EventCard({ item }: { item: Event }) {
  const date = new Date(item.scheduledAt)
  const isPast = date < new Date()
  const typeLabel = item.type === 'LISTENING_CALL' ? '리스닝콜' : '포럼'

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(public)/events/${item.id}` as never)}
      className={`bg-white rounded-xl p-4 mb-3 shadow-sm mx-4 ${isPast ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-start gap-3">
        {/* 날짜 카드 */}
        <View className="items-center bg-primary/10 rounded-xl px-3 py-2 min-w-[52px]">
          <Text className="text-primary font-bold text-xl leading-tight">
            {date.getDate()}
          </Text>
          <Text className="text-primary text-xs font-medium">
            {date.toLocaleDateString('ko-KR', { month: 'short' })}
          </Text>
          <Text className="text-gray-500 text-xs">
            {date.toLocaleDateString('ko-KR', { year: 'numeric' }).replace('년', '')}
          </Text>
        </View>

        {/* 내용 */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <View className={`px-2 py-0.5 rounded-full ${isPast ? 'bg-gray-200' : 'bg-primary'}`}>
              <Text className={`text-xs font-medium ${isPast ? 'text-gray-500' : 'text-white'}`}>
                {isPast ? '종료' : typeLabel}
              </Text>
            </View>
            {!isPast && item.zoomUrl && (
              <View className="px-2 py-0.5 bg-blue-100 rounded-full">
                <Text className="text-blue-700 text-xs font-medium">온라인</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-900 font-semibold" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.maxAttendees && (
            <Text className="text-gray-400 text-xs mt-0.5">
              최대 {item.maxAttendees}명
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function EventsScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => api.get<Event[]>('/api/events'),
  })

  const events: Event[] = Array.isArray(data) ? data : (data as { data?: Event[] })?.data ?? []

  const upcoming = events.filter((e) => new Date(e.scheduledAt) >= new Date())
  const past = events.filter((e) => new Date(e.scheduledAt) < new Date())
  const sorted = [...upcoming, ...past]

  return (
    <>
      <Stack.Screen options={{ title: '행사 일정', headerShown: true }} />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1B3A6B" />
          </View>
        ) : isError ? (
          <ErrorView onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
            ListHeaderComponent={
              upcoming.length > 0 ? (
                <View className="mx-4 mb-3">
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    예정된 행사 {upcoming.length}개
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                emoji="📅"
                title="예정된 행사가 없습니다"
                message="새로운 행사가 등록되면 알려드리겠습니다."
              />
            }
            renderItem={({ item }) => <EventCard item={item} />}
          />
        )}
      </View>
    </>
  )
}
