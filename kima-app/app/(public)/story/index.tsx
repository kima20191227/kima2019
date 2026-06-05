import React from 'react'
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { Image } from 'expo-image'
import { api } from '@/api/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Story } from '@/types'

interface StoryPage {
  data?: Story[]
  stories?: Story[]
  nextCursor?: string | null
  total?: number
}

const PAGE_SIZE = 10

function StoryCard({ item }: { item: Story }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(public)/story/${item.id}` as never)}
      className="bg-white rounded-xl overflow-hidden shadow-sm mb-3 mx-4 flex-row"
    >
      <View style={{ width: 100 }}>
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={{ width: 100, height: 90 }}
            contentFit="cover"
          />
        ) : (
          <View
            className="bg-gray-100 items-center justify-center"
            style={{ width: 100, height: 90 }}
          >
            <Text className="text-3xl">📖</Text>
          </View>
        )}
      </View>
      <View className="flex-1 p-3 justify-between">
        <Text className="text-gray-900 font-semibold text-sm leading-snug" numberOfLines={3}>
          {item.title}
        </Text>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-gray-400 text-xs">
            {new Date(item.createdAt).toLocaleDateString('ko-KR')}
          </Text>
          {item.videoUrls && item.videoUrls.length > 0 && (
            <View className="flex-row items-center gap-1">
              <Text className="text-xs">▶</Text>
              <Text className="text-primary text-xs font-medium">영상</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function StoryListScreen() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['stories', 'list'],
    queryFn: ({ pageParam }) =>
      api.get<StoryPage>('/api/stories', {
        limit: String(PAGE_SIZE),
        ...(pageParam ? { cursor: String(pageParam) } : {}),
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? null,
  })

  const stories: Story[] = data?.pages.flatMap(
    (p) => p?.data ?? p?.stories ?? [],
  ) ?? []

  return (
    <>
      <Stack.Screen options={{ title: '스토리', headerShown: true }} />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1B3A6B" />
          </View>
        ) : isError ? (
          <ErrorView onRetry={() => refetch()} />
        ) : (
          <FlatList
            data={stories}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
            ListEmptyComponent={
              <EmptyState
                emoji="📭"
                title="등록된 스토리가 없습니다"
                message="첫 번째 스토리를 기다리고 있습니다."
              />
            }
            ListFooterComponent={
              hasNextPage ? (
                <TouchableOpacity
                  onPress={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="mx-4 mt-2 py-3 border border-gray-300 rounded-xl items-center"
                >
                  {isFetchingNextPage ? (
                    <ActivityIndicator size="small" color="#1B3A6B" />
                  ) : (
                    <Text className="text-gray-600 text-sm font-medium">더 보기</Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => <StoryCard item={item} />}
          />
        )}
      </View>
    </>
  )
}
