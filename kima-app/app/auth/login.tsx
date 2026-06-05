import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'

// ─── Zod 스키마 ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(8, '비밀번호는 8자 이상이어야 합니다.'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit({ email, password }: LoginFormData) {
    setServerError(null)
    try {
      await login(email.trim().toLowerCase(), password)
      router.replace('/(tabs)')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      setServerError(message)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* 로고 */}
          <View className="items-center mb-10">
            <Text className="text-primary text-4xl font-bold">KIMA</Text>
            <Text className="text-gray-500 text-sm mt-1">한국이주민선교연합회</Text>
          </View>

          {/* 서버 에러 배너 */}
          {serverError && (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-700 text-sm text-center">{serverError}</Text>
            </View>
          )}

          {/* 이메일 필드 */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">이메일</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="이메일 주소"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`border rounded-xl px-4 py-3.5 text-gray-800 bg-gray-50 ${
                    errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</Text>
            )}
          </View>

          {/* 비밀번호 필드 */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">비밀번호</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`flex-row border rounded-xl bg-gray-50 ${
                    errors.password ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="비밀번호 (8자 이상)"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    className="flex-1 px-4 py-3.5 text-gray-800"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    className="px-4 items-center justify-center"
                  >
                    <Text className="text-gray-400 text-xs">{showPassword ? '숨김' : '표시'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</Text>
            )}
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={`py-4 rounded-xl items-center mb-3 ${
              isSubmitting ? 'bg-gray-300' : 'bg-primary'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-base">로그인</Text>
            )}
          </TouchableOpacity>

          {/* 회원가입 이동 */}
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
            className="py-3 items-center"
          >
            <Text className="text-gray-500 text-sm">
              계정이 없으신가요?{' '}
              <Text className="text-primary font-medium">회원가입</Text>
            </Text>
          </TouchableOpacity>

          {/* 안내 */}
          <View className="mt-auto pt-6 p-4 bg-blue-50 rounded-xl">
            <Text className="text-blue-700 text-xs text-center leading-5">
              소셜 로그인(구글·카카오)은 kima2019.org에서{'\n'}
              먼저 가입 후 이메일로 로그인하세요.
            </Text>
          </View>

          {/* 닫기 */}
          <TouchableOpacity onPress={() => router.back()} className="mt-3 py-2 items-center">
            <Text className="text-gray-400 text-sm">닫기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
