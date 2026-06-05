import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useLocalSearchParams, Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { ErrorView } from '@/components/ui/ErrorView'
import type { Event } from '@/types'

// ─── 폼 스키마 ────────────────────────────────────────────────────────────────

const attendSchema = z.object({
  name: z.string().min(2, '이름을 2자 이상 입력해주세요'),
  email: z.string().email('올바른 이메일 형식으로 입력해주세요'),
  phone: z.string().optional(),
})

type AttendForm = z.infer<typeof attendSchema>

// ─── 참석 폼 컴포넌트 ─────────────────────────────────────────────────────────

function AttendSection({ eventId }: { eventId: string }) {
  const { user, isAuthenticated } = useAuth()
  const [submitted, setSubmitted] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendForm>({
    resolver: zodResolver(attendSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: AttendForm) =>
      api.post(`/api/events/${eventId}/attend`, data),
    onSuccess: () => setSubmitted(true),
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '신청 중 오류가 발생했습니다.'
      Alert.alert('신청 실패', msg)
    },
  })

  if (submitted) {
    return (
      <View className="bg-green-50 border border-green-200 rounded-xl p-4 mx-4 mb-6">
        <Text className="text-green-800 font-semibold text-base mb-1">✅ 신청 완료!</Text>
        <Text className="text-green-700 text-sm">
          참석 신청이 완료되었습니다. 확인 이메일을 확인해주세요.
        </Text>
      </View>
    )
  }

  return (
    <View className="mx-4 mb-10">
      <Text className="text-gray-900 font-bold text-base mb-4">참석 신청</Text>

      {!isAuthenticated && (
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <Text className="text-blue-700 text-sm">
            로그인하지 않아도 신청 가능합니다. 로그인 시 정보가 자동으로 입력됩니다.
          </Text>
        </View>
      )}

      {/* 이름 */}
      <View className="mb-3">
        <Text className="text-gray-700 text-sm font-medium mb-1.5">
          이름 <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="홍길동"
              placeholderTextColor="#9CA3AF"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            />
          )}
        />
        {errors.name && (
          <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>
        )}
      </View>

      {/* 이메일 */}
      <View className="mb-3">
        <Text className="text-gray-700 text-sm font-medium mb-1.5">
          이메일 <Text className="text-red-500">*</Text>
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="example@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            />
          )}
        />
        {errors.email && (
          <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>
        )}
      </View>

      {/* 전화번호 */}
      <View className="mb-5">
        <Text className="text-gray-700 text-sm font-medium mb-1.5">전화번호 (선택)</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="010-0000-0000"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            />
          )}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit((data) => mutation.mutate(data))}
        disabled={mutation.isPending}
        className="bg-primary py-4 rounded-xl items-center"
      >
        {mutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">참석 신청하기</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAuthenticated } = useAuth()

  const { data: event, isLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get<Event>(`/api/events/${id}`),
    enabled: !!id,
  })

  const handleJoinZoom = async () => {
    if (!event?.zoomUrl) return
    await WebBrowser.openBrowserAsync(event.zoomUrl)
  }

  const date = event ? new Date(event.scheduledAt) : null
  const typeLabel = event?.type === 'LISTENING_CALL' ? '리스닝콜' : '포럼'
  const isPast = date ? date < new Date() : false

  return (
    <>
      <Stack.Screen options={{ title: typeLabel, headerShown: true }} />
      <View className="flex-1 bg-gray-50">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#1B3A6B" />
          </View>
        ) : isError || !event ? (
          <ErrorView onRetry={() => refetch()} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 헤더 배너 */}
            <View className="bg-primary px-5 pt-6 pb-10">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="px-2 py-0.5 bg-white/20 rounded-full">
                  <Text className="text-white text-xs font-medium">{typeLabel}</Text>
                </View>
                {isPast && (
                  <View className="px-2 py-0.5 bg-white/10 rounded-full">
                    <Text className="text-blue-200 text-xs">종료된 행사</Text>
                  </View>
                )}
              </View>
              <Text className="text-white text-xl font-bold leading-snug">{event.title}</Text>
            </View>

            {/* 날짜/시간 카드 */}
            <View className="mx-4 -mt-5 bg-white rounded-2xl shadow-sm p-4 mb-4">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">📅</Text>
                <View>
                  <Text className="text-gray-900 font-semibold">
                    {date?.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-0.5">
                    {date?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>

              {event.maxAttendees && (
                <View className="flex-row items-center gap-3 mt-3">
                  <Text className="text-2xl">👥</Text>
                  <Text className="text-gray-700 text-sm">최대 {event.maxAttendees}명 참석</Text>
                </View>
              )}

              {/* Zoom 링크 (로그인 회원에게만) */}
              {event.zoomUrl && isAuthenticated && (
                <TouchableOpacity
                  onPress={handleJoinZoom}
                  className="flex-row items-center gap-3 mt-3 bg-blue-50 rounded-xl p-3"
                >
                  <Text className="text-2xl">💻</Text>
                  <View className="flex-1">
                    <Text className="text-blue-700 font-medium text-sm">Zoom 참여 링크</Text>
                    <Text className="text-blue-500 text-xs mt-0.5" numberOfLines={1}>
                      {event.zoomUrl}
                    </Text>
                  </View>
                  <Text className="text-blue-500 text-xs">열기 →</Text>
                </TouchableOpacity>
              )}

              {event.zoomUrl && !isAuthenticated && (
                <View className="flex-row items-center gap-3 mt-3 bg-gray-50 rounded-xl p-3">
                  <Text className="text-2xl">🔒</Text>
                  <Text className="text-gray-500 text-sm">
                    Zoom 링크는 로그인 후 확인 가능합니다
                  </Text>
                </View>
              )}
            </View>

            {/* 소개 */}
            {event.description && (
              <View className="mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm">
                <Text className="text-gray-900 font-semibold mb-2">행사 소개</Text>
                <Text className="text-gray-700 text-sm leading-relaxed">{event.description}</Text>
              </View>
            )}

            {/* 참석 신청 (과거 행사 제외) */}
            {!isPast && <AttendSection eventId={id ?? ''} />}

            {isPast && (
              <View className="mx-4 mb-10 p-4 bg-gray-100 rounded-xl">
                <Text className="text-gray-500 text-sm text-center">종료된 행사입니다.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </>
  )
}
