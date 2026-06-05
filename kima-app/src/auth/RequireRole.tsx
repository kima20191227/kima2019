import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { hasRole, isPremiumActive, isPremiumExpired } from '@/utils/roleGuard'
import type { UserRole } from '@/types'

interface RequireRoleProps {
  minRole: UserRole
  children: React.ReactNode
  /** 권한 미달 시 대체 UI. 제공하지 않으면 기본 안내 화면 표시 */
  fallback?: React.ReactNode
}

export function RequireRole({ minRole, children, fallback }: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  // 1) 로딩 중
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1B3A6B" />
      </View>
    )
  }

  // 2) 미로그인
  if (!isAuthenticated || !user) {
    if (fallback) return <>{fallback}</>
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-gray-900 font-bold text-xl text-center mb-2">
          로그인이 필요합니다
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-6">
          이 콘텐츠는 로그인 후 이용할 수 있습니다.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          className="bg-primary py-3 px-8 rounded-xl"
        >
          <Text className="text-white font-semibold">로그인 하기</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // 3) 정회원 만료 (PREMIUM role이지만 expiresAt 경과)
  if (minRole === 'PREMIUM' && isPremiumExpired(user)) {
    if (fallback) return <>{fallback}</>
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-4xl mb-4">⏰</Text>
        <Text className="text-gray-900 font-bold text-xl text-center mb-2">
          정회원이 만료되었습니다
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-2">
          만료일:{' '}
          {user.expiresAt
            ? new Date(user.expiresAt).toLocaleDateString('ko-KR')
            : '알 수 없음'}
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-6">
          갱신 후 다시 이용하실 수 있습니다.
        </Text>
        <View className="bg-gray-100 rounded-xl p-4 w-full mb-4">
          <Text className="text-gray-700 text-sm font-medium mb-1">갱신 방법</Text>
          <Text className="text-gray-600 text-sm leading-5">
            국민은행 263101-04-561156{'\n'}
            예금주: 이창호(한국이주민선교연합회){'\n'}
            입금 후 admin@kima2019.org로 연락해주세요.
          </Text>
        </View>
      </View>
    )
  }

  // 4) PREMIUM 요구이지만 비활성 (role이 MEMBER)
  if (minRole === 'PREMIUM' && !isPremiumActive(user)) {
    if (fallback) return <>{fallback}</>
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-4xl mb-4">🔐</Text>
        <Text className="text-gray-900 font-bold text-xl text-center mb-2">
          정회원 전용 콘텐츠입니다
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-6">
          연 5만원 납부 후 정회원 승인을 받으면 이용할 수 있습니다.
        </Text>
        <View className="bg-secondary-50 border border-secondary-200 rounded-xl p-4 w-full">
          <Text className="text-gray-700 text-sm font-medium mb-1">정회원 신청 방법</Text>
          <Text className="text-gray-600 text-sm leading-5">
            국민은행 263101-04-561156{'\n'}
            예금주: 이창호(한국이주민선교연합회){'\n'}
            입금 후 admin@kima2019.org로 연락해주세요.
          </Text>
        </View>
      </View>
    )
  }

  // 5) role 계층 미달 (OFFICER, ADMIN 요구)
  if (!hasRole(user.role, minRole)) {
    if (fallback) return <>{fallback}</>
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-4xl mb-4">🚫</Text>
        <Text className="text-gray-900 font-bold text-xl text-center mb-2">
          접근 권한이 없습니다
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          이 콘텐츠는 임원 이상만 이용할 수 있습니다.
        </Text>
      </View>
    )
  }

  // 6) 통과
  return <>{children}</>
}
