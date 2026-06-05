import React, { useState } from 'react'
import {
  View,
  Text,
  Switch,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface PushSettings {
  notifyPost: boolean
  notifyEvent: boolean
  notifyShare: boolean
  hasToken: boolean
}

// ─── 설정 항목 정의 ───────────────────────────────────────────────────────────

const SETTINGS_ITEMS: {
  key: keyof Omit<PushSettings, 'hasToken'>
  emoji: string
  label: string
  desc: string
}[] = [
  {
    key: 'notifyPost',
    emoji: '📢',
    label: '공지 알림',
    desc: '새 공지가 등록되면 알림을 받습니다',
  },
  {
    key: 'notifyEvent',
    emoji: '📅',
    label: '행사 알림',
    desc: '리스닝콜·포럼 3일 전 리마인더를 받습니다',
  },
  {
    key: 'notifyShare',
    emoji: '🤝',
    label: '사역나눔 알림',
    desc: '새 사역나눔 게시글 등록 시 알림을 받습니다',
  },
]

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()

  // 설정 조회
  const { data, isLoading, isError } = useQuery({
    queryKey: ['push-settings'],
    queryFn: () => api.get<PushSettings>('/api/mobile/push-settings'),
    enabled: isAuthenticated,
  })

  // 로컬 상태 (낙관적 UI)
  const [localSettings, setLocalSettings] = useState<
    Omit<PushSettings, 'hasToken'> | null
  >(null)

  const current = localSettings ?? {
    notifyPost: data?.notifyPost ?? true,
    notifyEvent: data?.notifyEvent ?? true,
    notifyShare: data?.notifyShare ?? true,
  }

  // 설정 변경 뮤테이션
  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: (settings: Partial<Omit<PushSettings, 'hasToken'>>) =>
      api.patch('/api/mobile/push-settings', settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['push-settings'] })
    },
    onError: () => {
      Alert.alert('오류', '설정 변경 중 오류가 발생했습니다.')
    },
  })

  function handleToggle(
    key: keyof Omit<PushSettings, 'hasToken'>,
    value: boolean,
  ) {
    const next = { ...current, [key]: value }
    setLocalSettings(next)
    updateSettings({ [key]: value })
  }

  if (!isAuthenticated) {
    router.replace('/auth/login')
    return null
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '알림 설정',
          headerShown: true,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#1B3A6B',
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          headerBackTitle: '마이',
          headerShadowVisible: false,
        }}
      />

      <ScrollView className="flex-1 bg-gray-50">
        {/* 헤더 설명 */}
        <View className="bg-primary px-5 pt-4 pb-5">
          <Text className="text-white font-bold text-base">앱 알림 설정</Text>
          <Text className="text-blue-200 text-sm mt-1">
            받고 싶은 알림 유형을 선택해 주세요
          </Text>
        </View>

        {/* 로딩 */}
        {isLoading && (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#1B3A6B" />
          </View>
        )}

        {/* 오류 */}
        {isError && (
          <View className="mx-4 mt-4 bg-red-50 rounded-2xl p-4">
            <Text className="text-red-600 text-sm text-center">
              설정을 불러오는 중 오류가 발생했습니다.
            </Text>
          </View>
        )}

        {/* 미등록 기기 안내 */}
        {data && !data.hasToken && !isLoading && (
          <View className="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-lg">📵</Text>
              <Text className="text-yellow-800 font-semibold text-sm">
                이 기기에 알림이 등록되지 않았습니다
              </Text>
            </View>
            <Text className="text-yellow-700 text-xs leading-relaxed">
              기기 설정에서 알림 권한을 허용하고 앱을 재시작하면 자동으로
              등록됩니다.
            </Text>
          </View>
        )}

        {/* 설정 항목 */}
        {!isLoading && !isError && (
          <View className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
            {SETTINGS_ITEMS.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  index < SETTINGS_ITEMS.length - 1 && styles.rowBorder,
                ]}
              >
                {/* 왼쪽: 아이콘 + 설명 */}
                <View style={styles.info}>
                  <View style={styles.iconWrap}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.desc}>{item.desc}</Text>
                  </View>
                </View>

                {/* 스위치 */}
                <Switch
                  value={current[item.key]}
                  onValueChange={(val) => handleToggle(item.key, val)}
                  disabled={isPending}
                  trackColor={{ false: '#E5E7EB', true: '#1B3A6B' }}
                  thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            ))}
          </View>
        )}

        {/* 기기 설정 안내 */}
        <View className="mx-4 mt-4 mb-8 bg-gray-100 rounded-2xl p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-base">ℹ️</Text>
            <Text className="text-gray-600 font-semibold text-sm">알림 권한</Text>
          </View>
          <Text className="text-gray-500 text-xs leading-relaxed">
            이 설정은 앱 내 알림 수신 여부를 제어합니다.{'\n'}
            기기 설정에서 KIMA 앱의 알림 권한이 허용되어 있어야 합니다.
          </Text>
          <TouchableOpacity
            onPress={() => {
              // iOS/Android 모두 설정 앱에서 직접 열어야 함 — 안내 문구로 대체
              Alert.alert(
                '기기 알림 설정',
                '기기 설정 → 앱 → KIMA → 알림을 허용해 주세요.',
                [{ text: '확인' }],
              )
            }}
            className="mt-3 bg-gray-200 rounded-xl py-2.5 items-center"
          >
            <Text className="text-gray-600 text-sm font-medium">
              기기 설정 안내 보기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  )
}

// ─── StyleSheet (Switch 행은 NativeWind gap이 불안정해 StyleSheet 사용) ──────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  desc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
})
