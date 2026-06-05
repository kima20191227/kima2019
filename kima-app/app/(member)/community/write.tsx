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
import { useLocalSearchParams, Stack, router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/api/client'
import { RequireRole } from '@/auth/RequireRole'
import { useToast } from '@/components/ui/Toast'

// ─── 스키마 ───────────────────────────────────────────────────────────────────

const postSchema = z.object({
  title: z
    .string()
    .min(2, '제목은 2자 이상 입력해주세요')
    .max(200, '제목은 200자 이하로 입력해주세요'),
  content: z.string().min(10, '내용은 10자 이상 입력해주세요'),
  type: z.enum(['NOTICE', 'SHARE'], {
    required_error: '게시 유형을 선택해주세요',
  }),
})

type PostForm = z.infer<typeof postSchema>

// ─── 필드 에러 ────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <Text className="text-red-500 text-xs mt-1">{message}</Text>
}

// ─── 폼 본문 ─────────────────────────────────────────────────────────────────

function WritePostContent() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string
    categoryName: string
  }>()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: { type: 'SHARE' },
  })

  const selectedType = watch('type')

  const mutation = useMutation({
    mutationFn: (data: PostForm) =>
      api.post('/api/posts', { ...data, categoryId }),
    onSuccess: () => {
      showToast('게시글이 등록되었습니다', 'success')
      queryClient.invalidateQueries({ queryKey: ['posts', categoryId] })
      router.back()
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        '게시글 등록 중 오류가 발생했습니다'
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
          title: categoryName ? `${categoryName} 글쓰기` : '글쓰기',
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
                <Text className="text-primary font-semibold">등록</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
        <View className="m-4 bg-white rounded-2xl p-4 shadow-sm">
          {/* 게시 유형 선택 */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-2">
              게시 유형 <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row gap-3">
              {([
                { value: 'SHARE', label: '사역 나눔', emoji: '🤝' },
                { value: 'NOTICE', label: '공지사항', emoji: '📢' },
              ] as const).map((opt) => (
                <Controller
                  key={opt.value}
                  control={control}
                  name="type"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      onPress={() => onChange(opt.value)}
                      className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border ${
                        value === opt.value
                          ? 'bg-primary border-primary'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text>{opt.emoji}</Text>
                      <Text
                        className={`text-sm font-medium ${
                          value === opt.value ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ))}
            </View>
            <FieldError message={errors.type?.message} />
          </View>

          {/* 제목 */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              제목 <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={
                    selectedType === 'NOTICE' ? '공지사항 제목을 입력하세요' : '나눔 제목을 입력하세요'
                  }
                  placeholderTextColor="#9CA3AF"
                  className={`bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 text-sm ${
                    errors.title ? 'border-red-400' : 'border-gray-200'
                  }`}
                  maxLength={200}
                />
              )}
            />
            <FieldError message={errors.title?.message} />
          </View>

          {/* 내용 */}
          <View className="mb-2">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              내용 <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="content"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="내용을 입력하세요 (최소 10자)"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                  className={`bg-gray-50 border rounded-xl px-4 py-3 text-gray-800 text-sm ${
                    errors.content ? 'border-red-400' : 'border-gray-200'
                  }`}
                  style={{ minHeight: 200 }}
                />
              )}
            />
            <FieldError message={errors.content?.message} />
          </View>
        </View>

        {/* 등록 버튼 (하단) */}
        <View className="mx-4 mb-10">
          <TouchableOpacity
            onPress={handleSubmit((data) => mutation.mutate(data))}
            disabled={mutation.isPending}
            className="bg-primary py-4 rounded-2xl items-center"
          >
            {mutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">게시글 등록</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── 메인 (OFFICER 이상만 접근) ───────────────────────────────────────────────

export default function WritePostScreen() {
  return (
    <RequireRole minRole="OFFICER">
      <WritePostContent />
    </RequireRole>
  )
}
