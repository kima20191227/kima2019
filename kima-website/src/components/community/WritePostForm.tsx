'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postSchema, type PostInput } from '@/schemas/post.schema'
import { FieldError } from '@/components/auth/FieldError'
import { Button } from '@/components/ui/Button'

interface WritePostFormProps {
  categoryId: string
  categoryName: string
  categoryType: string
  categorySlug: string
  canWriteNotice: boolean
  mode?: 'create' | 'edit'
  postId?: string
  initialValues?: {
    title: string
    content: string
    type: PostInput['type']
  }
}

export function WritePostForm({
  categoryId,
  categoryName,
  categoryType,
  categorySlug,
  canWriteNotice,
  mode = 'create',
  postId,
  initialValues,
}: WritePostFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = mode === 'edit'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: isEdit && initialValues
      ? { categoryId, type: initialValues.type, title: initialValues.title, content: initialValues.content }
      : { categoryId, type: 'SHARE' },
  })

  const onSubmit = async (data: PostInput) => {
    setServerError(null)
    try {
      const url = isEdit ? `/api/posts/${postId}` : '/api/posts'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json()
        setServerError(body.error ?? '게시글 처리 중 오류가 발생했습니다.')
        return
      }
      if (isEdit && postId) {
        router.push(`/community/${categoryType}/${categorySlug}/posts/${postId}`)
      } else {
        router.push(`/community/${categoryType}/${categorySlug}`)
      }
      router.refresh()
    } catch {
      setServerError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register('categoryId')} />

      {/* 유형 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          게시글 유형 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          {[
            { value: 'SHARE', label: '사역 나눔' },
            ...(canWriteNotice ? [{ value: 'NOTICE', label: '공지사항' }] : []),
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                {...register('type')}
                type="radio"
                value={opt.value}
                className="accent-[#1B3A6B]"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.type?.message} />
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          placeholder={`[${categoryName}] 제목을 입력해주세요`}
        />
        <FieldError message={errors.title?.message} />
      </div>

      {/* 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('content')}
          rows={12}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none"
          placeholder="내용을 입력해주세요 (최소 10자)"
        />
        <FieldError message={errors.content?.message} />
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          취소
        </Button>
        <Button type="submit" className="flex-1" isLoading={isSubmitting}>
          {isSubmitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정 완료' : '게시글 등록')}
        </Button>
      </div>
    </form>
  )
}
