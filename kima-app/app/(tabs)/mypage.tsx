import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useAuth } from '@/auth/AuthContext'
import { isPremiumActive, isPremiumExpired } from '@/utils/roleGuard'
import { unregisterPushToken } from '@/utils/pushNotification'
import type { UserRole } from '@/types'

// ─── 역할 메타 ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<UserRole, string> = {
  MEMBER:  '일반회원',
  PREMIUM: '정회원',
  OFFICER: '임원',
  ADMIN:   '관리자',
}

const ROLE_STYLE: Record<UserRole, string> = {
  MEMBER:  'bg-gray-100 text-gray-600',
  PREMIUM: 'bg-yellow-100 text-yellow-800',
  OFFICER: 'bg-blue-100 text-blue-800',
  ADMIN:   'bg-red-100 text-red-800',
}

// ─── 미로그인 뷰 ──────────────────────────────────────────────────────────────

function GuestView() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-primary px-5 pt-14 pb-4">
        <Text className="text-white text-xl font-bold">마이페이지</Text>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-5xl mb-5">👤</Text>
        <Text className="text-gray-900 font-bold text-xl mb-2">KIMA 회원이신가요?</Text>
        <Text className="text-gray-500 text-sm text-center mb-8 leading-relaxed">
          로그인하면 내 정보, 등급, 활동 내역을{'\n'}확인할 수 있습니다.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          className="bg-primary py-3.5 rounded-xl mb-3 w-full items-center"
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

// ─── 메뉴 아이템 ──────────────────────────────────────────────────────────────

function MenuItem({
  emoji,
  label,
  sublabel,
  onPress,
  danger,
}: {
  emoji: string
  label: string
  sublabel?: string
  onPress: () => void
  danger?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-5 py-4 border-b border-gray-50"
    >
      <Text className="text-xl mr-3">{emoji}</Text>
      <View className="flex-1">
        <Text className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-800'}`}>
          {label}
        </Text>
        {sublabel && (
          <Text className="text-gray-400 text-xs mt-0.5">{sublabel}</Text>
        )}
      </View>
      {!danger && <Text className="text-gray-300 text-base">›</Text>}
    </TouchableOpacity>
  )
}

// ─── 로그인 상태 뷰 ───────────────────────────────────────────────────────────

function ProfileView() {
  const { user, logout } = useAuth()
  if (!user) return null

  const premiumActive  = isPremiumActive(user)
  const premiumExpired = isPremiumExpired(user)
  const isMember       = user.role === 'MEMBER'
  const isPremiumRole  = user.role === 'PREMIUM'

  function handleLogout() {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          // 서버에서 푸시 토큰 삭제 (토큰이 유효할 때 먼저 호출)
          await unregisterPushToken()
          await logout()
          router.replace('/(tabs)/home')
        },
      },
    ])
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View className="bg-primary px-5 pt-14 pb-8">
        <Text className="text-white text-xl font-bold">마이페이지</Text>
      </View>

      {/* 프로필 카드 */}
      <View className="mx-4 -mt-5 bg-white rounded-2xl p-5 shadow-sm mb-4">
        <View className="flex-row items-start justify-between mb-2">
          {/* 아바타 */}
          <View className="w-14 h-14 rounded-full bg-primary/20 items-center justify-center mr-3">
            <Text className="text-primary font-bold text-xl">
              {(user.name ?? user.email)[0].toUpperCase()}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-gray-900 font-bold text-lg leading-snug">
              {user.name ?? '이름 없음'}
            </Text>
            <Text className="text-gray-500 text-sm mt-0.5">{user.email}</Text>
            {user.organization && (
              <Text className="text-gray-400 text-xs mt-0.5">📍 {user.organization}</Text>
            )}
          </View>

          {/* 등급 배지 */}
          <View className={`px-3 py-1.5 rounded-full ${ROLE_STYLE[user.role]}`}>
            <Text className="text-xs font-semibold">{ROLE_LABEL[user.role]}</Text>
          </View>
        </View>

        {/* 정회원 만료 상태 */}
        {isPremiumRole && (
          <View
            className={`mt-3 px-4 py-2.5 rounded-xl ${
              premiumActive
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                premiumActive ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {premiumExpired
                ? '⚠️ 정회원 만료됨 — 갱신이 필요합니다'
                : '✓ 정회원 유효'}
              {user.expiresAt
                ? `  (${new Date(user.expiresAt).toLocaleDateString('ko-KR')} 까지)`
                : ''}
            </Text>
          </View>
        )}

        {/* 가입일 */}
        <Text className="text-gray-300 text-xs mt-3">
          가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
        </Text>
      </View>

      {/* 계정 메뉴 */}
      <View className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <View className="px-5 py-3 border-b border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            계정
          </Text>
        </View>

        <MenuItem
          emoji="✏️"
          label="프로필 수정"
          sublabel="이름, 소속, 지역, 연락처 변경"
          onPress={() => router.push('/(member)/mypage/edit')}
        />

        {(isMember || (isPremiumRole && premiumExpired)) && (
          <MenuItem
            emoji="⭐"
            label={premiumExpired ? '정회원 갱신 신청' : '정회원 신청'}
            sublabel="자료실·네트워크 이용 가능"
            onPress={() => router.push('/(member)/mypage/upgrade')}
          />
        )}

        {isPremiumRole && premiumActive && (
          <MenuItem
            emoji="🌐"
            label="리스닝콜 네트워크"
            sublabel="온라인 연합 모임 일정 확인"
            onPress={() => router.push('/(member)/network')}
          />
        )}
      </View>

      {/* 앱 메뉴 */}
      <View className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <View className="px-5 py-3 border-b border-gray-100">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            앱 설정
          </Text>
        </View>

        <MenuItem
          emoji="🔔"
          label="알림 설정"
          sublabel="행사·공지 알림 관리"
          onPress={() => router.push('/(member)/mypage/notifications')}
        />

        <MenuItem
          emoji="🔐"
          label="개인정보처리방침"
          sublabel="kima2019.org/privacy"
          onPress={() =>
            WebBrowser.openBrowserAsync('https://kima2019.org/privacy')
          }
        />
      </View>

      {/* 연동 계정 */}
      {user.providers.length > 0 && (
        <View className="mx-4 mb-4 bg-white rounded-2xl shadow-sm px-5 py-4">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            연동 계정
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {user.providers.map((p) => (
              <View key={p} className="px-3 py-1 bg-gray-100 rounded-full">
                <Text className="text-gray-600 text-xs capitalize">{p}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 로그아웃 */}
      <View className="mx-4 mb-12 bg-white rounded-2xl shadow-sm overflow-hidden">
        <MenuItem
          emoji="🚪"
          label="로그아웃"
          onPress={handleLogout}
          danger
        />
      </View>
    </ScrollView>
  )
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export default function MyPageScreen() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <ProfileView /> : <GuestView />
}
