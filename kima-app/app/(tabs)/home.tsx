import React, { useCallback, useState } from 'react'
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Story, Event } from '@/types'

const { width: SCREEN_W } = Dimensions.get('window')

// ─── API 응답 타입 ────────────────────────────────────────────────────────────

interface StoriesResponse {
  data?: Story[]
  stories?: Story[]
}

// ─── 섹션 데이터 (FlatList용) ─────────────────────────────────────────────────

type Section =
  | { type: 'header' }
  | { type: 'stats' }
  | { type: 'vision' }
  | { type: 'story_header' }
  | { type: 'story'; item: Story }
  | { type: 'event_header' }
  | { type: 'event'; item: Event }
  | { type: 'donate_banner' }

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function HeroHeader({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  return (
    <View className="bg-primary px-5 pt-14 pb-8">
      <Text className="text-white text-2xl font-bold">KIMA</Text>
      <Text className="text-blue-200 text-sm mt-0.5">한국이주민선교연합회</Text>
      {user ? (
        <Text className="text-white text-sm mt-3">
          안녕하세요, {user.name ?? user.email}님 👋
        </Text>
      ) : (
        <View className="flex-row gap-2 mt-4">
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            className="flex-1 border border-white/60 py-2 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-medium">로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
            className="flex-1 bg-white/20 py-2 rounded-lg items-center"
          >
            <Text className="text-white text-sm font-medium">회원가입</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

function StatsSection({ orgCount }: { orgCount: number }) {
  const stats = [
    { value: '280만', label: '국내 이주민' },
    { value: orgCount > 0 ? `${orgCount}+` : '—', label: '등록 단체' },
    { value: '40회+', label: '리스닝콜' },
  ]
  return (
    <View className="mx-4 -mt-4 bg-white rounded-2xl shadow-sm p-4">
      <View className="flex-row justify-around">
        {stats.map((s) => (
          <View key={s.label} className="items-center">
            <Text className="text-primary text-2xl font-bold">{s.value}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const VISIONS = [
  { key: 'CONNECT', label: '연결', desc: '전국 단체 네트워크', emoji: '🔗' },
  { key: 'DATA', label: '기록', desc: '이주민 현황 데이터', emoji: '📊' },
  { key: 'STORY', label: '보이게', desc: '현장 스토리 공유', emoji: '📸' },
  { key: 'FUND', label: '후원', desc: '사역 재정 지원', emoji: '💛' },
]

function VisionSection() {
  return (
    <View className="mx-4 mt-4">
      <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        4대 비전
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {VISIONS.map((v) => (
          <View
            key={v.key}
            className="bg-primary rounded-xl p-4"
            style={{ width: (SCREEN_W - 40) / 2 - 4 }}
          >
            <Text className="text-xl mb-1">{v.emoji}</Text>
            <Text className="text-secondary font-bold text-sm">{v.key}</Text>
            <Text className="text-white font-semibold mt-0.5">{v.label}</Text>
            <Text className="text-blue-200 text-xs mt-0.5">{v.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function StoryCard({ item }: { item: Story }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(public)/story/${item.id}` as never)}
      className="bg-white rounded-xl overflow-hidden shadow-sm"
      style={{ width: SCREEN_W * 0.72 }}
    >
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
          style={{ width: '100%', height: 120 }}
          contentFit="cover"
        />
      ) : (
        <View className="bg-gray-100 items-center justify-center" style={{ height: 120 }}>
          <Text className="text-3xl">📖</Text>
        </View>
      )}
      <View className="p-3">
        <Text className="text-gray-900 font-semibold text-sm" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-gray-400 text-xs mt-1">
          {new Date(item.createdAt).toLocaleDateString('ko-KR')}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

function EventCard({ item }: { item: Event }) {
  const date = new Date(item.scheduledAt)
  const typeLabel = item.type === 'LISTENING_CALL' ? '리스닝콜' : '포럼'
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(public)/events/${item.id}` as never)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1.5">
            <View className="px-2 py-0.5 bg-primary rounded-full">
              <Text className="text-white text-xs font-medium">{typeLabel}</Text>
            </View>
          </View>
          <Text className="text-gray-900 font-semibold" numberOfLines={2}>
            {item.title}
          </Text>
        </View>
        <View className="items-center bg-gray-50 rounded-xl px-3 py-2 min-w-[52px]">
          <Text className="text-primary font-bold text-lg leading-tight">
            {date.getDate()}
          </Text>
          <Text className="text-gray-500 text-xs">
            {date.toLocaleDateString('ko-KR', { month: 'short' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function DonateBanner() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/(public)/donate' as never)}
      className="mx-4 mt-2 mb-10 p-5 rounded-2xl bg-secondary"
    >
      <Text className="text-white font-bold text-base mb-1">💛 사역을 후원해주세요</Text>
      <Text className="text-yellow-100 text-sm">
        이주민 선교를 위해 함께해 주시는 모든 분께 감사드립니다.
      </Text>
      <Text className="text-white font-medium text-sm mt-2">후원 계좌 확인 →</Text>
    </TouchableOpacity>
  )
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const storiesQ = useQuery({
    queryKey: ['stories', 'home'],
    queryFn: () => api.get<StoriesResponse>('/api/stories', { limit: '3' }),
  })

  const eventsQ = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => api.get<Event[]>('/api/events'),
  })

  const orgsQ = useQuery({
    queryKey: ['orgs', 'count'],
    queryFn: () => api.get<{ total?: number; data?: unknown[] }>('/api/organizations'),
    select: (d) => (Array.isArray(d) ? d.length : d?.total ?? 0),
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['stories', 'home'] })
    await queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] })
    setRefreshing(false)
  }, [queryClient])

  const isLoading = storiesQ.isLoading && eventsQ.isLoading
  const isError = storiesQ.isError && eventsQ.isError

  const stories: Story[] = storiesQ.data?.data ?? storiesQ.data?.stories ?? []
  const events: Event[] = Array.isArray(eventsQ.data) ? eventsQ.data.slice(0, 3) : []
  const orgCount = typeof orgsQ.data === 'number' ? orgsQ.data : 0

  // FlatList 데이터 구성
  const sections: Section[] = [
    { type: 'header' },
    { type: 'stats' },
    { type: 'vision' },
    ...(stories.length > 0 ? [{ type: 'story_header' } as Section] : []),
    ...stories.map((item): Section => ({ type: 'story', item })),
    ...(events.length > 0 ? [{ type: 'event_header' } as Section] : []),
    ...events.map((item): Section => ({ type: 'event', item })),
    { type: 'donate_banner' },
  ]

  if (isError) {
    return (
      <View className="flex-1 bg-gray-50">
        <HeroHeader user={user} />
        <ErrorView onRetry={() => { storiesQ.refetch(); eventsQ.refetch() }} />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {isLoading ? (
        <>
          <HeroHeader user={user} />
          <View className="mx-4 mt-4"><SkeletonList count={3} /></View>
        </>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item, i) => `${item.type}-${i}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1B3A6B"
              colors={['#1B3A6B']}
            />
          }
          renderItem={({ item }) => {
            switch (item.type) {
              case 'header':
                return <HeroHeader user={user} />
              case 'stats':
                return <StatsSection orgCount={orgCount} />
              case 'vision':
                return <VisionSection />
              case 'story_header':
                return (
                  <View className="mx-4 mt-5 flex-row items-center justify-between">
                    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      최신 스토리
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(public)/story' as never)}>
                      <Text className="text-primary text-xs font-medium">전체 보기 →</Text>
                    </TouchableOpacity>
                  </View>
                )
              case 'story':
                return (
                  <View className="mt-3 pl-4">
                    <StoryCard item={item.item} />
                  </View>
                )
              case 'event_header':
                return (
                  <View className="mx-4 mt-5 mb-3 flex-row items-center justify-between">
                    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      다가오는 행사
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(public)/events' as never)}>
                      <Text className="text-primary text-xs font-medium">전체 보기 →</Text>
                    </TouchableOpacity>
                  </View>
                )
              case 'event':
                return (
                  <View className="mx-4">
                    <EventCard item={item.item} />
                  </View>
                )
              case 'donate_banner':
                return <DonateBanner />
              default:
                return null
            }
          }}
        />
      )}
    </View>
  )
}
