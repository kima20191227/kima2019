import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, Stack, router } from 'expo-router'
import { Image } from 'expo-image'
import * as WebBrowser from 'expo-web-browser'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { RequireRole } from '@/auth/RequireRole'
import { hasRole } from '@/utils/roleGuard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Category, Post, Resource } from '@/types'

// ─── 탭 정의 ─────────────────────────────────────────────────────────────────

type SectionTab = '공지' | '나눔' | '자료'
const SECTION_TABS: SectionTab[] = ['공지', '나눔', '자료']

// ─── 담당 위원장 카드 ──────────────────────────────────────────────────────────

function OfficerCard({ category }: { category: Category }) {
  if (!category.officerName && !category.officerSns && !category.officerQr) return null

  return (
    <View className="mx-4 mb-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
      <Text className="text-blue-800 text-xs font-semibold uppercase tracking-wider mb-3">
        담당 위원장
      </Text>

      <View className="flex-row items-center gap-4">
        {/* QR 코드 이미지 */}
        {category.officerQr && (
          <Image
            source={{ uri: category.officerQr }}
            style={{ width: 72, height: 72, borderRadius: 8 }}
            contentFit="contain"
          />
        )}

        <View className="flex-1">
          {category.officerName && (
            <Text className="text-gray-900 font-bold text-base">{category.officerName}</Text>
          )}
          {category.officerSns && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`https://open.kakao.com/o/${category.officerSns}`)}
            >
              <Text className="text-primary text-sm mt-0.5">
                💬 {category.officerSns}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="text-blue-600 text-xs mt-3 leading-relaxed">
        🔒 보안이 필요한 문의는 담당 위원장에게 직접 연락해 주세요.
      </Text>
    </View>
  )
}

// ─── 게시글 카드 ──────────────────────────────────────────────────────────────

function PostCard({ post }: { post: Post }) {
  const isNotice = post.type === 'NOTICE'
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(member)/community/posts/${post.id}` as never)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-center gap-2 mb-1.5">
        <View
          className={`px-2 py-0.5 rounded-full ${
            isNotice ? 'bg-red-100' : 'bg-blue-100'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              isNotice ? 'text-red-700' : 'text-blue-700'
            }`}
          >
            {isNotice ? '공지' : '나눔'}
          </Text>
        </View>
        {post.author?.name && (
          <Text className="text-gray-400 text-xs">{post.author.name}</Text>
        )}
      </View>
      <Text className="text-gray-900 font-medium" numberOfLines={2}>{post.title}</Text>
      <Text className="text-gray-400 text-xs mt-1">
        {new Date(post.createdAt).toLocaleDateString('ko-KR')}
      </Text>
    </TouchableOpacity>
  )
}

// ─── 자료 카드 ────────────────────────────────────────────────────────────────

function ResourceCard({
  resource,
  userCanAccess,
}: {
  resource: Resource
  userCanAccess: boolean
}) {
  const handlePress = async () => {
    if (!userCanAccess) return
    await WebBrowser.openBrowserAsync(resource.driveUrl)
  }

  const lockIcon = resource.accessLevel === 'PREMIUM' ? '🔑' : '🔵'
  const accessLabel =
    resource.accessLevel === 'PUBLIC'
      ? ''
      : resource.accessLevel === 'MEMBER'
      ? '회원'
      : '정회원'

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!userCanAccess}
      className={`bg-white rounded-xl p-4 mb-3 shadow-sm ${
        !userCanAccess ? 'opacity-60' : ''
      }`}
    >
      <View className="flex-row items-start gap-3">
        {/* 파일 타입 아이콘 */}
        <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center">
          <Text className="text-lg">
            {resource.fileType === 'PDF'
              ? '📄'
              : resource.fileType === 'PPT'
              ? '📊'
              : resource.fileType === 'DOC'
              ? '📝'
              : '📁'}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-gray-900 font-medium text-sm" numberOfLines={2}>
            {resource.title}
          </Text>
          {resource.description && (
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {resource.description}
            </Text>
          )}
          <View className="flex-row items-center gap-2 mt-1.5">
            {resource.fileType && (
              <View className="px-2 py-0.5 bg-gray-100 rounded-full">
                <Text className="text-gray-500 text-xs">{resource.fileType}</Text>
              </View>
            )}
            {resource.accessLevel !== 'PUBLIC' && (
              <View className="flex-row items-center gap-1">
                <Text className="text-xs">{lockIcon}</Text>
                <Text className="text-xs text-gray-500">{accessLabel}</Text>
              </View>
            )}
          </View>
        </View>

        {userCanAccess ? (
          <Text className="text-primary text-xs mt-1">열기 →</Text>
        ) : (
          <View className="px-2 py-1 bg-yellow-50 rounded-lg">
            <Text className="text-yellow-700 text-xs font-medium">정회원 전용</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

// ─── 본문 ─────────────────────────────────────────────────────────────────────

function CategoryCommunityContent() {
  const { categoryType, slug } = useLocalSearchParams<{
    categoryType: string
    slug: string
  }>()
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<SectionTab>('공지')

  // 카테고리 정보 fetch
  const categoryQ = useQuery({
    queryKey: ['category', slug],
    queryFn: () =>
      api.get<Category[] | { data: Category[] }>('/api/categories', { slug }),
    select: (d): Category | null => {
      const arr = Array.isArray(d) ? d : (d as { data?: Category[] }).data ?? []
      return arr[0] ?? null
    },
    enabled: !!slug,
  })

  const category = categoryQ.data

  // 공지 게시글
  const noticeQ = useQuery({
    queryKey: ['posts', category?.id, 'NOTICE'],
    queryFn: () =>
      api.get<Post[] | { data: Post[] }>('/api/posts', {
        categoryId: category!.id,
        type: 'NOTICE',
      }),
    select: (d) => (Array.isArray(d) ? d : (d as { data?: Post[] }).data ?? []),
    enabled: !!category?.id,
  })

  // 나눔 게시글
  const shareQ = useQuery({
    queryKey: ['posts', category?.id, 'SHARE'],
    queryFn: () =>
      api.get<Post[] | { data: Post[] }>('/api/posts', {
        categoryId: category!.id,
        type: 'SHARE',
      }),
    select: (d) => (Array.isArray(d) ? d : (d as { data?: Post[] }).data ?? []),
    enabled: !!category?.id,
  })

  // 자료
  const resourceQ = useQuery({
    queryKey: ['resources', category?.id],
    queryFn: () =>
      api.get<Resource[] | { data: Resource[] }>('/api/resources', {
        categoryId: category!.id,
      }),
    select: (d) => (Array.isArray(d) ? d : (d as { data?: Resource[] }).data ?? []),
    enabled: !!category?.id,
  })

  const isOfficer = user ? hasRole(user.role, 'OFFICER') : false
  const isPremium = user ? hasRole(user.role, 'PREMIUM') : false

  const activeData =
    activeSection === '공지'
      ? noticeQ
      : activeSection === '나눔'
      ? shareQ
      : resourceQ

  if (categoryQ.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1B3A6B" />
      </View>
    )
  }

  if (categoryQ.isError || !category) {
    return <ErrorView onRetry={() => categoryQ.refetch()} />
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: category.name,
          headerShown: true,
          headerRight: () =>
            isOfficer ? (
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    {
                      pathname: '/(member)/community/write',
                      params: { categoryId: category.id, categoryName: category.name },
                    } as never,
                  )
                }
                className="mr-1"
              >
                <Text className="text-primary font-semibold text-sm">✏️ 글쓰기</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      {/* 섹션 탭 */}
      <View className="bg-white border-b border-gray-100 px-4 py-2 flex-row gap-2">
        {SECTION_TABS.map((tab) => {
          const active = activeSection === tab
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveSection(tab)}
              className={`flex-1 py-2 rounded-xl items-center ${
                active ? 'bg-primary' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-600'}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* 담당 위원장 카드 */}
      {activeSection === '공지' && (
        <View className="mt-4">
          <OfficerCard category={category} />
        </View>
      )}

      {/* 섹션 콘텐츠 */}
      {activeData.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B3A6B" />
        </View>
      ) : activeData.isError ? (
        <ErrorView onRetry={() => activeData.refetch()} />
      ) : activeSection === '자료' ? (
        <FlatList
          data={resourceQ.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState emoji="📁" title="등록된 자료가 없습니다" />
          }
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              userCanAccess={
                item.accessLevel === 'PUBLIC' ||
                item.accessLevel === 'MEMBER' ||
                (item.accessLevel === 'PREMIUM' && isPremium)
              }
            />
          )}
        />
      ) : (
        <FlatList
          data={activeSection === '공지' ? noticeQ.data ?? [] : shareQ.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              emoji="📭"
              title="게시글이 없습니다"
              message={
                isOfficer
                  ? '우측 상단 글쓰기 버튼으로 첫 게시글을 작성해 보세요.'
                  : undefined
              }
            />
          }
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}
    </View>
  )
}

// ─── 메인 (권한 보호) ─────────────────────────────────────────────────────────

export default function CategoryCommunityScreen() {
  return (
    <RequireRole minRole="MEMBER">
      <CategoryCommunityContent />
    </RequireRole>
  )
}
