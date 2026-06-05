import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { RequireRole } from '@/auth/RequireRole'
import { canAccessResource } from '@/utils/roleGuard'
import { ResourceItem } from '@/components/resources/ResourceItem'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorView } from '@/components/ui/ErrorView'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import type { Resource } from '@/types'

// ─── 카테고리 탭 정의 ────────────────────────────────────────────────────────

interface CategoryTab {
  key: string
  label: string
  keywords: string[]
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all',     label: '전체',       keywords: [] },
  { key: 'visa',    label: '비자·법률',  keywords: ['비자', '법률', '법적', '이민', '체류'] },
  { key: 'health',  label: '의료·복지',  keywords: ['의료', '복지', '건강', '보건', '병원'] },
  { key: 'fund',    label: '보조금·공모', keywords: ['보조금', '공모', '지원금', '신청', '공고'] },
  { key: 'mission', label: '선교·훈련',  keywords: ['선교', '훈련', '교육', '세미나', '사역'] },
]

// ─── 카테고리 필터 함수 ───────────────────────────────────────────────────────

function matchesCategory(resource: Resource, tab: CategoryTab): boolean {
  if (tab.key === 'all') return true
  const target = [
    resource.title,
    resource.description ?? '',
    resource.category?.name ?? '',
  ]
    .join(' ')
    .toLowerCase()
  return tab.keywords.some((kw) => target.includes(kw))
}

// ─── 자료실 목록 본문 ─────────────────────────────────────────────────────────

function ResourcesContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('all')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['resources', 'premium'],
    queryFn: () =>
      api.get<Resource[] | { data: Resource[] }>('/api/resources'),
    select: (d) => (Array.isArray(d) ? d : (d as { data?: Resource[] }).data ?? []),
    staleTime: 2 * 60_000,
  })

  const allResources = data ?? []

  const currentTab = CATEGORY_TABS.find((t) => t.key === activeTab) ?? CATEGORY_TABS[0]
  const filtered = allResources.filter((r) => matchesCategory(r, currentTab))

  return (
    <View className="flex-1 bg-gray-50">
      {/* 헤더 */}
      <View className="bg-primary px-5 pt-14 pb-5">
        <Text className="text-white text-xl font-bold">자료실</Text>
        <Text className="text-blue-200 text-sm mt-0.5">
          {isLoading ? '불러오는 중...' : `총 ${allResources.length}개 자료`}
        </Text>
      </View>

      {/* 카테고리 탭 */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = activeTab === tab.key
            const count =
              tab.key === 'all'
                ? allResources.length
                : allResources.filter((r) => matchesCategory(r, tab)).length

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-row items-center px-3.5 py-2 mr-2 rounded-full border ${
                  active
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    active ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-white/30' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* 목록 */}
      {isLoading ? (
        <View className="p-4">
          <SkeletonList count={4} variant="row" />
        </View>
      ) : isError ? (
        <ErrorView onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <EmptyState
              emoji="📭"
              title="자료가 없습니다"
              message={
                activeTab !== 'all'
                  ? '다른 카테고리를 선택해 보세요.'
                  : '관리자가 자료를 등록하면 표시됩니다.'
              }
              actionLabel={activeTab !== 'all' ? '전체 보기' : undefined}
              onAction={activeTab !== 'all' ? () => setActiveTab('all') : undefined}
            />
          }
          renderItem={({ item }) => (
            <ResourceItem
              resource={item}
              canAccess={canAccessResource(user, item.accessLevel)}
              onPress={() => router.push(`/(premium)/resources/${item.id}` as never)}
            />
          )}
        />
      )}
    </View>
  )
}

// ─── 메인 (권한 보호) ─────────────────────────────────────────────────────────

export default function ResourcesIndexScreen() {
  return (
    <RequireRole minRole="PREMIUM">
      <ResourcesContent />
    </RequireRole>
  )
}
