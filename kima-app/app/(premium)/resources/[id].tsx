import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { RequireRole } from '@/auth/RequireRole'
import { canAccessResource } from '@/utils/roleGuard'
import { ErrorView } from '@/components/ui/ErrorView'
import type { AccessLevel, Resource } from '@/types'

// ─── 파일 타입 스타일 ─────────────────────────────────────────────────────────

const FILE_TYPE_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  PDF: { bg: '#FEE2E2', text: '#B91C1C', icon: '📄' },
  PPT: { bg: '#FFEDD5', text: '#C2410C', icon: '📊' },
  DOC: { bg: '#DBEAFE', text: '#1D4ED8', icon: '📝' },
  XLS: { bg: '#DCFCE7', text: '#15803D', icon: '📈' },
  ETC: { bg: '#F3F4F6', text: '#6B7280', icon: '📁' },
}

const ACCESS_INFO: Record<AccessLevel, { label: string; color: string }> = {
  PUBLIC:  { label: '공개',   color: '#6B7280' },
  MEMBER:  { label: '회원',   color: '#1D4ED8' },
  PREMIUM: { label: '정회원', color: '#92400E' },
}

// ─── 상세 내용 ────────────────────────────────────────────────────────────────

function ResourceDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()

  const { data: resource, isLoading, isError, refetch } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => api.get<Resource>(`/api/resources/${id}`),
    enabled: !!id,
  })

  const handleOpenDrive = async () => {
    if (!resource) return

    if (!canAccessResource(user, resource.accessLevel)) {
      Alert.alert('접근 권한 없음', '이 자료는 정회원만 열람할 수 있습니다.')
      return
    }

    try {
      await WebBrowser.openBrowserAsync(resource.driveUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      })
    } catch {
      Alert.alert('오류', '구글 드라이브를 열 수 없습니다.')
    }
  }

  const fileStyle = resource?.fileType
    ? (FILE_TYPE_STYLE[resource.fileType] ?? FILE_TYPE_STYLE.ETC)
    : FILE_TYPE_STYLE.ETC

  const accessInfo = resource ? ACCESS_INFO[resource.accessLevel] : null
  const userCanAccess = resource ? canAccessResource(user, resource.accessLevel) : false

  return (
    <>
      <Stack.Screen
        options={{
          title: '자료 상세',
          headerShown: true,
        }}
      />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1B3A6B" />
          </View>
        ) : isError || !resource ? (
          <ErrorView onRetry={() => refetch()} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 헤더 카드 */}
            <View className="bg-white px-5 pt-6 pb-5 border-b border-gray-100">
              {/* 파일 타입 아이콘 */}
              <View className="flex-row items-start gap-4 mb-4">
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: fileStyle.bg }}
                >
                  <Text className="text-3xl">{fileStyle.icon}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-lg leading-snug">
                    {resource.title}
                  </Text>
                  {resource.category?.name && (
                    <Text className="text-gray-500 text-sm mt-1">
                      {resource.category.name}
                    </Text>
                  )}
                </View>
              </View>

              {/* 배지 행 */}
              <View className="flex-row items-center gap-2 flex-wrap">
                {/* 파일 형식 */}
                {resource.fileType && (
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: fileStyle.bg }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: fileStyle.text }}
                    >
                      {resource.fileType}
                    </Text>
                  </View>
                )}

                {/* 접근 등급 */}
                {accessInfo && (
                  <View className="px-3 py-1 bg-gray-100 rounded-full">
                    <Text className="text-xs font-medium" style={{ color: accessInfo.color }}>
                      {accessInfo.label}
                    </Text>
                  </View>
                )}

                {/* 등록일 */}
                <Text className="text-gray-300 text-xs ml-auto">
                  {new Date(resource.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            {/* 설명 */}
            {resource.description && (
              <View className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm">
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                  자료 설명
                </Text>
                <Text className="text-gray-700 text-sm leading-relaxed">
                  {resource.description}
                </Text>
              </View>
            )}

            {/* 접근 불가 안내 */}
            {!userCanAccess && (
              <View className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Text className="text-lg">⚠️</Text>
                  <Text className="text-yellow-800 font-semibold text-sm">접근 제한 자료</Text>
                </View>
                <Text className="text-yellow-700 text-sm leading-relaxed">
                  이 자료는 정회원만 열람할 수 있습니다.{'\n'}
                  정회원 신청 후 관리자 승인을 받으시면{'\n'}
                  바로 이용하실 수 있습니다.
                </Text>
              </View>
            )}

            {/* 열기 버튼 */}
            <View className="mx-4 mt-4 mb-10">
              <TouchableOpacity
                onPress={handleOpenDrive}
                disabled={!userCanAccess}
                className={`py-4 rounded-2xl items-center flex-row justify-center gap-3 ${
                  userCanAccess ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <Text className="text-xl">📂</Text>
                <View>
                  <Text
                    className={`font-bold text-base ${
                      userCanAccess ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    구글 드라이브에서 열기
                  </Text>
                  {userCanAccess && (
                    <Text className="text-blue-200 text-xs text-center mt-0.5">
                      새 탭으로 열립니다
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {!userCanAccess && (
                <Text className="text-gray-400 text-xs text-center mt-2">
                  정회원 이상만 열람 가능한 자료입니다
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </>
  )
}

// ─── 메인 (권한 보호) ─────────────────────────────────────────────────────────

export default function ResourceDetailScreen() {
  return (
    <RequireRole minRole="PREMIUM">
      <ResourceDetailContent />
    </RequireRole>
  )
}
