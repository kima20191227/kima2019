import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/auth/AuthContext'
import { isPremiumActive, isPremiumExpired } from '@/utils/roleGuard'
import { PremiumGate } from '@/components/ui/PremiumGate'
import ResourcesIndexScreen from '../(premium)/resources/index'

// ─── 미로그인 게이트 ──────────────────────────────────────────────────────────

function LoginGate() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary px-5 pt-14 pb-4">
        <Text className="text-white text-xl font-bold">자료실</Text>
        <Text className="text-blue-200 text-sm mt-0.5">비자·법률·의료·선교 자료</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-gray-900 font-bold text-xl text-center mb-2">
          로그인이 필요합니다
        </Text>
        <Text className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
          자료실은 로그인 후 이용할 수 있습니다.{'\n'}
          정회원 가입 시 전체 자료를 열람하실 수 있습니다.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          className="bg-primary py-3.5 rounded-xl w-full items-center mb-3"
        >
          <Text className="text-white font-semibold text-base">로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/auth/register')}
          className="border border-primary py-3.5 rounded-xl w-full items-center"
        >
          <Text className="text-primary font-semibold text-base">회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── 정회원 만료 게이트 ───────────────────────────────────────────────────────

function ExpiredGate({ expiresAt }: { expiresAt: string | null }) {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary px-5 pt-14 pb-4">
        <Text className="text-white text-xl font-bold">자료실</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-4xl mb-4">⏰</Text>
        <Text className="text-gray-900 font-bold text-xl text-center mb-2">
          정회원이 만료되었습니다
        </Text>
        {expiresAt && (
          <Text className="text-gray-500 text-sm text-center mb-1">
            만료일: {new Date(expiresAt).toLocaleDateString('ko-KR')}
          </Text>
        )}
        <Text className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
          갱신 후 자료실을 다시 이용하실 수 있습니다.
        </Text>

        <View className="bg-gray-100 rounded-2xl p-4 w-full mb-6">
          <Text className="text-gray-700 text-sm font-semibold mb-2">갱신 방법</Text>
          <Text className="text-gray-600 text-sm leading-relaxed">
            국민은행 263101-04-561156{'\n'}
            예금주: 이창호 (한국이주민선교연합회){'\n'}
            연회비: 50,000원{'\n'}
            입금 후 admin@kima2019.org로 연락해주세요.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(member)/mypage/upgrade')}
          className="bg-secondary py-3.5 rounded-xl w-full items-center"
        >
          <Text className="text-white font-semibold text-base">정회원 갱신 신청</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── 메인 라우터 ──────────────────────────────────────────────────────────────

export default function ResourcesScreen() {
  const { user, isAuthenticated, isLoading } = useAuth()

  // 부트스트랩 중
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1B3A6B" />
      </View>
    )
  }

  // 1) 미로그인
  if (!isAuthenticated || !user) {
    return <LoginGate />
  }

  // 2) PREMIUM이지만 만료됨 (갱신 필요)
  if (isPremiumExpired(user)) {
    return <ExpiredGate expiresAt={user.expiresAt} />
  }

  // 3) 정회원 활성 / OFFICER / ADMIN → 자료실 열람
  if (isPremiumActive(user)) {
    return <ResourcesIndexScreen />
  }

  // 4) MEMBER (정회원 미신청 또는 미승인)
  return <PremiumGate />
}
