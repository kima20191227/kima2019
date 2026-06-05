import React from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Stack, router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { RequireRole } from '@/auth/RequireRole'
import { useToast } from '@/components/ui/Toast'

// ─── 스키마 ───────────────────────────────────────────────────────────────────

const REGIONS = [
  '서울경기인천', '부산경남', '대구경북', '광주전라', '대전충청', '강원제주',
] as const

const profileSchema = z.object({
  name:         z.string().min(2, '이름은 2자 이상 입력해주세요').max(50, '이름은 50자 이하로 입력해주세요'),
  organization: z.string().max(100, '단체명은 100자 이하로 입력해주세요').optional(),
  region:       z.string().optional(),
  phone:        z
    .string()
    .regex(/^(010-\d{4}-\d{4}|)$/, '010-XXXX-XXXX 형식으로 입력해주세요')
    .optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

// ─── 필드 에러 ────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <Text className="text-red-500 text-xs mt-1">{message}</Text>
}

// ─── 라벨 + 입력 필드 래퍼 ────────────────────────────────────────────────────

function FormField({
  label,
  required,
  children,
  error,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
}) {
  return (
    <View className="mb-5">
      <Text className="text-gray-700 text-sm font-medium mb-1.5">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      {children}
      <FieldError message={error} />
    </View>
  )
}

// ─── 프로필 수정 폼 ───────────────────────────────────────────────────────────

function EditProfileContent() {
  const { user, refreshProfile } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:         user?.name    ?? '',
      organization: user?.organization ?? '',
      region:       user?.region  ?? '',
      phone:        user?.phone   ?? '',
    },
  })

  const selectedRegion = watch('region')

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => api.patch('/api/member/profile', data),
    onSuccess: async () => {
      await refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      showToast('프로필이 업데이트되었습니다', 'success')
      router.back()
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '업데이트 중 오류가 발생했습니다'
      showToast(msg, 'error')
    },
  })

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <Stack.Screen
        options={{
          title: '프로필 수정',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSubmit((data) => mutation.mutate(data))}
              disabled={mutation.isPending}
              className="mr-1"
            >
              {mutation.isPending ? (
                <ActivityIndicator size="small" color="#1B3A6B" />
              ) : (
                <Text className="text-primary font-semibold">저장</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
        <View className="m-4 bg-white rounded-2xl p-5 shadow-sm">
          {/* 이름 */}
          <FormField label="이름" required error={errors.name?.message}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="홍길동"
                  placeholderTextColor="#9CA3AF"
                  className={`bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 ${
                    errors.name ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
              )}
            />
          </FormField>

          {/* 소속 단체 */}
          <FormField label="소속 단체" error={errors.organization?.message}>
            <Controller
              control={control}
              name="organization"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="소속 단체 또는 교회명"
                  placeholderTextColor="#9CA3AF"
                  className={`bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 ${
                    errors.organization ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
              )}
            />
          </FormField>

          {/* 지역 선택 */}
          <FormField label="활동 지역" error={errors.region?.message}>
            <View className="flex-row flex-wrap gap-2">
              {REGIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setValue('region', selectedRegion === r ? '' : r)}
                  className={`px-3 py-2 rounded-xl border ${
                    selectedRegion === r
                      ? 'bg-primary border-primary'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      selectedRegion === r ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          {/* 전화번호 */}
          <FormField label="전화번호" error={errors.phone?.message}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="010-0000-0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className={`bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 ${
                    errors.phone ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
              )}
            />
          </FormField>
        </View>

        {/* 저장 버튼 (하단) */}
        <View className="mx-4 mb-10">
          <TouchableOpacity
            onPress={handleSubmit((data) => mutation.mutate(data))}
            disabled={mutation.isPending}
            className="bg-primary py-4 rounded-2xl items-center"
          >
            {mutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">저장하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── 메인 (권한 보호) ─────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  return (
    <RequireRole minRole="MEMBER">
      <EditProfileContent />
    </RequireRole>
  )
}
