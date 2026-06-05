import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/api/client'
import { RequireRole } from '@/auth/RequireRole'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorView } from '@/components/ui/ErrorView'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import type { Category, CategoryType } from '@/types'

// ─── 탭 설정 ──────────────────────────────────────────────────────────────────

interface TabDef {
  key: CategoryType
  label: string
  emoji: string
}

const TABS: TabDef[] = [
  { key: 'REGION',   label: '지역별',     emoji: '📍' },
  { key: 'LANGUAGE', label: '언어권별',   emoji: '🌏' },
  { key: 'TARGET',   label: '사역대상별', emoji: '🤝' },
]

// ─── 카테고리 카드 ────────────────────────────────────────────────────────────

function CategoryCard({ item, categoryType }: { item: Category; categoryType: CategoryType }) {
  return (
    <TouchableOpacity
      onPress={() =>
        router.push(
          `/(member)/community/${categoryType}/${item.slug}` as never,
        )
      }
      className="bg-white rounded-2xl p-4 shadow-sm"
      style={{ flex: 1 }}
    >
      <Text className="text-gray-900 font-semibold text-sm leading-snug mb-1">
        {item.name}
      </Text>
      {item.officerName && (
        <Text className="text-gray-400 text-xs" numberOfLines={1}>
          담당: {item.officerName}
        </Text>
      )}
      <View className="mt-2 self-start px-2 py-0.5 bg-primary/10 rounded-full">
        <Text className="text-primary text-xs font-medium">→ 게시판</Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── 카테고리 그리드 ──────────────────────────────────────────────────────────

function CategoryGrid({ categoryType }: { categoryType: CategoryType }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories', categoryType],
    queryFn: () =>
      api.get<Category[] | { data: Category[] }>('/api/categories', { type: categoryType }),
    select: (d) => (Array.isArray(d) ? d : d.data ?? []),
    staleTime: 5 * 60_000,
  })

  if (isLoading) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <SkeletonList count={6} variant="row" />
      </ScrollView>
    )
  }

  if (isError) {
    return <ErrorView onRetry={() => refetch()} />
  }

  const categories = data ?? []

  if (categories.length === 0) {
    return (
      <EmptyState
        emoji="📭"
        title="카테고리가 없습니다"
        message="곧 등록될 예정입니다."
      />
    )
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      columnWrapperStyle={{ gap: 12 }}
      removeClippedSubviews
      renderItem={({ item }) => (
        <CategoryCard item={item} categoryType={categoryType} />
      )}
    />
  )
}

// ─── 커뮤니티 본문 ────────────────────────────────────────────────────────────

function CommunityContent() {
  const [activeTab, setActiveTab] = useState<CategoryType>('REGION')

  return (
    <View className="flex-1 bg-gray-50">
      {/* 헤더 */}
      <View className="bg-primary px-5 pt-14 pb-4">
        <Text className="text-white text-xl font-bold">커뮤니티</Text>
        <Text className="text-blue-200 text-sm mt-0.5">
          지역·언어권·사역대상별 게시판
        </Text>
      </View>

      {/* 탭 바 */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row px-4 py-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.key
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  className={`flex-row items-center px-4 py-2.5 mr-2 rounded-full ${
                    active ? 'bg-primary' : 'bg-gray-100'
                  }`}
                >
                  <Text className="mr-1">{tab.emoji}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      active ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* 카테고리 그리드 */}
      <CategoryGrid key={activeTab} categoryType={activeTab} />
    </View>
  )
}

// ─── 탭 화면 (권한 보호) ─────────────────────────────────────────────────────

export default function CommunityScreen() {
  return (
    <RequireRole minRole="MEMBER">
      <CommunityContent />
    </RequireRole>
  )
}
