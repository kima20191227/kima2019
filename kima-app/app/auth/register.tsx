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
import { api } from '@/api/client'

// ─── Zod 스키마 ───────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, '이름은 2자 이상 입력해주세요.')
      .max(50, '이름은 50자 이하여야 합니다.'),
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .email('올바른 이메일 형식이 아닙니다.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(/[A-Za-z]/, '영문자를 포함해야 합니다.')
      .regex(/[0-9]/, '숫자를 포함해야 합니다.'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
    organization: z.string().max(100, '단체명은 100자 이하여야 합니다.').optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 일치하지 않습니다.',
  })

type RegisterFormData = z.infer<typeof registerSchema>

// ─── 필드 래퍼 컴포넌트 ───────────────────────────────────────────────────────

interface FieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 text-sm font-medium mb-1.5">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      {children}
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  )
}

// ─── 화면 ─────────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      organization: '',
    },
  })

  async function onSubmit(data: RegisterFormData) {
    setServerError(null)
    try {
      await api.post('/api/auth/register', {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        organization: data.organization?.trim() || undefined,
      })
      // 가입 성공 → 로그인 화면으로 이동
      router.replace('/auth/login')
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      setServerError(message)
    }
  }

  const inputClass = (hasError: boolean) =>
    `border rounded-xl px-4 py-3.5 text-gray-800 bg-gray-50 ${
      hasError ? 'border-red-400' : 'border-gray-200'
    }`

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 pt-14 pb-8">
          {/* 헤더 */}
          <View className="items-center mb-8">
            <Text className="text-gray-900 text-2xl font-bold">회원가입</Text>
            <Text className="text-gray-500 text-sm mt-1">KIMA 커뮤니티에 참여하세요</Text>
          </View>

          {/* 서버 에러 배너 */}
          {serverError && (
            <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Text className="text-red-700 text-sm text-center">{serverError}</Text>
            </View>
          )}

          {/* 이름 */}
          <Field label="이름" error={errors.name?.message} required>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="실명 (2자 이상)"
                  placeholderTextColor="#9CA3AF"
                  className={inputClass(!!errors.name)}
                />
              )}
            />
          </Field>

          {/* 이메일 */}
          <Field label="이메일" error={errors.email?.message} required>
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
                  className={inputClass(!!errors.email)}
                />
              )}
            />
          </Field>

          {/* 비밀번호 */}
          <Field label="비밀번호" error={errors.password?.message} required>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className={`flex-row border rounded-xl bg-gray-50 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="영문+숫자 조합 8자 이상"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    className="flex-1 px-4 py-3.5 text-gray-800"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    className="px-3 items-center justify-center"
                  >
                    <Text className="text-gray-400 text-xs">{showPassword ? '숨김' : '표시'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </Field>

          {/* 비밀번호 확인 */}
          <Field label="비밀번호 확인" error={errors.passwordConfirm?.message} required>
            <Controller
              control={control}
              name="passwordConfirm"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className={`flex-row border rounded-xl bg-gray-50 ${errors.passwordConfirm ? 'border-red-400' : 'border-gray-200'}`}>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="비밀번호 다시 입력"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirm}
                    className="flex-1 px-4 py-3.5 text-gray-800"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm((v) => !v)}
                    className="px-3 items-center justify-center"
                  >
                    <Text className="text-gray-400 text-xs">{showConfirm ? '숨김' : '표시'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </Field>

          {/* 소속단체 (선택) */}
          <Field label="소속 단체" error={errors.organization?.message}>
            <Controller
              control={control}
              name="organization"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="소속 단체명 (선택)"
                  placeholderTextColor="#9CA3AF"
                  className={inputClass(!!errors.organization)}
                />
              )}
            />
          </Field>

          {/* 가입 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={`py-4 rounded-xl items-center mt-2 mb-3 ${
              isSubmitting ? 'bg-gray-300' : 'bg-primary'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-base">가입하기</Text>
            )}
          </TouchableOpacity>

          {/* 로그인 이동 */}
          <TouchableOpacity onPress={() => router.back()} className="py-3 items-center">
            <Text className="text-gray-500 text-sm">
              이미 계정이 있으신가요?{' '}
              <Text className="text-primary font-medium">로그인</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
