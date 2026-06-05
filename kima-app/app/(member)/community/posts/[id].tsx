import React from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, Stack } from 'expo-router'
import { api } from '@/api/client'
import { RequireRole } from '@/auth/RequireRole'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Post } from '@/types'

// ─── 게시글 상세 본문 ─────────────────────────────────────────────────────────

function PostDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get<Post>(`/api/posts/${id}`),
    enabled: !!id,
  })

  const isNotice = post?.type === 'NOTICE'

  return (
    <>
      <Stack.Screen
        options={{
          title: isNotice ? '공지사항' : '사역 나눔',
          headerShown: true,
        }}
      />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1B3A6B" />
          </View>
        ) : isError || !post ? (
          <ErrorView onRetry={() => refetch()} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 게시글 헤더 */}
            <View className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
              {/* 유형 배지 */}
              <View className="flex-row items-center gap-2 mb-3">
                <View
                  className={`px-2.5 py-1 rounded-full ${
                    isNotice ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isNotice ? 'text-red-700' : 'text-blue-700'
                    }`}
                  >
                    {isNotice ? '📢 공지사항' : '🤝 사역 나눔'}
                  </Text>
                </View>
                {post.category?.name && (
                  <Text className="text-gray-400 text-xs">{post.category.name}</Text>
                )}
              </View>

              {/* 제목 */}
              <Text className="text-gray-900 font-bold text-xl leading-snug mb-3">
                {post.title}
              </Text>

              {/* 메타 정보 */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-primary text-xs font-bold">
                      {post.author?.name?.[0] ?? 'K'}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm">
                    {post.author?.name ?? '관리자'}
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs">
                  {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* 게시글 본문 */}
            <View className="bg-white mx-0 mt-2 px-5 py-5">
              <Text className="text-gray-800 text-base leading-8 tracking-wide">
                {post.content}
              </Text>
            </View>

            {/* 수정일 */}
            {post.updatedAt !== post.createdAt && (
              <View className="mx-4 mt-3 mb-10">
                <Text className="text-gray-400 text-xs text-right">
                  수정됨:{' '}
                  {new Date(post.updatedAt).toLocaleDateString('ko-KR')}
                </Text>
              </View>
            )}

            <View className="h-16" />
          </ScrollView>
        )}
      </View>
    </>
  )
}

// ─── 메인 (권한 보호) ─────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  return (
    <RequireRole minRole="MEMBER">
      <PostDetailContent />
    </RequireRole>
  )
}
