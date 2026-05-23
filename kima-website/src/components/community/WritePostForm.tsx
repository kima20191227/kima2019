'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postSchema, type PostInput, type PostAttachment } from '@/schemas/post.schema'
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
    attachments?: PostAttachment[]
  }
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

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
  const [attachments, setAttachments] = useState<PostAttachment[]>(initialValues?.attachments ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = mode === 'edit'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: isEdit && initialValues
      ? { categoryId, type: initialValues.type, title: initialValues.title, content: initialValues.content }
      : { categoryId, type: 'SHARE', content: '' },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    setUploading(true)
    setServerError(null)

    const uploaded: PostAttachment[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/resource', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        setServerError(`"${file.name}" 업로드 실패: ${data.error ?? '알 수 없는 오류'}`)
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      const { url, fileType } = await res.json()
      uploaded.push({ url, name: file.name, type: file.type || fileType || 'FILE' })
    }

    setAttachments((prev) => [...prev, ...uploaded])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit = async (data: PostInput) => {
    setServerError(null)
    try {
      const url = isEdit ? `/api/posts/${postId}` : '/api/posts'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, attachments }),
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
        <div className="flex gap-4 flex-wrap">
          {[
            { value: 'SHARE', label: '사역 나눔' },
            ...(categoryType === 'language' ? [{ value: 'INTRODUCE', label: `${categoryName} 알아가기` }] : []),
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
          내용
        </label>
        <textarea
          {...register('content')}
          rows={12}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none"
          placeholder="내용을 입력해주세요 (선택 사항)"
        />
        <FieldError message={errors.content?.message} />
      </div>

      {/* 파일 첨부 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          파일·사진 첨부 <span className="text-xs text-gray-400 font-normal">(여러 파일 동시 선택 가능)</span>
        </label>

        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-[#1B3A6B]/30 text-sm text-[#1B3A6B] cursor-pointer hover:bg-[#1B3A6B]/5 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {uploading ? '업로드 중...' : '파일 선택'}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        {/* 첨부 목록 */}
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {attachments.map((att, idx) => {
              const isImage = IMAGE_TYPES.includes(att.type)
              return (
                <li key={idx} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={att.url} alt={att.name} className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-[#1B3A6B]/10 rounded text-[#1B3A6B] text-xs font-bold">
                      {att.type.split('/').pop()?.toUpperCase().slice(0, 4) ?? 'FILE'}
                    </div>
                  )}
                  <span className="flex-1 text-xs text-gray-600 truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
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
        <Button type="submit" className="flex-1" isLoading={isSubmitting || uploading}>
          {isSubmitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정 완료' : '게시글 등록')}
        </Button>
      </div>
    </form>
  )
}
