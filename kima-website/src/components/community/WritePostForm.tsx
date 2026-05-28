'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postSchema, type PostInput, type PostAttachment } from '@/schemas/post.schema'
import { FieldError } from '@/components/auth/FieldError'
import { Button } from '@/components/ui/Button'
import { ThumbnailUpload } from '@/components/ui/ThumbnailUpload'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

// ─── Props ───────────────────────────────────────────────────────────────────

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

// ─── 업로드 진행 아이콘 ────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="w-7 h-7 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

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

  // 기존 썸네일(isCover=true인 첨부)
  const existingThumbnail =
    initialValues?.attachments?.find((a) => a.isCover)?.url ?? null
  const [thumbnail, setThumbnail] = useState<string | null>(existingThumbnail)

  // 기존 일반 첨부파일(isCover=false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    (initialValues?.attachments ?? [])
      .filter((a) => !a.isCover)
      .map((a) => ({ url: a.url, name: a.name, type: a.type })),
  )
  const [fileUploading, setFileUploading] = useState(false)

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

  const { ref: contentFormRef, ...contentRegister } = register('content')

  const handleFilesChange = useCallback((files: AttachedFile[], uploading: boolean) => {
    setAttachedFiles(files)
    setFileUploading(uploading)
  }, [])

  // ─── 제출 ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: PostInput) => {
    if (fileUploading) {
      setServerError('파일 업로드가 완료될 때까지 기다려주세요.')
      return
    }
    setServerError(null)

    // 썸네일은 isCover:true 첨부파일로 패키징
    const attachments: PostAttachment[] = [
      ...(thumbnail ? [{ url: thumbnail, name: 'thumbnail', type: 'image/jpeg', isCover: true }] : []),
      ...attachedFiles.map((f) => ({ url: f.url, name: f.name, type: f.type, isCover: false })),
    ]

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

  // ─── 렌더 ──────────────────────────────────────────────────────────────────

  const typeOptions = [
    { value: 'SHARE', label: '사역 나눔' },
    ...(categoryType === 'language' ? [{ value: 'INTRODUCE', label: `${categoryName} 알아가기` }] : []),
    ...(canWriteNotice ? [{ value: 'NOTICE', label: '공지사항' }] : []),
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('categoryId')} />

      {/* ── 유형 선택 ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          게시글 유형 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {typeOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input {...register('type')} type="radio" value={opt.value} className="accent-[#1B3A6B]" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.type?.message} />
      </div>

      {/* ── 제목 ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          placeholder={`[${categoryName}] 제목을 입력해주세요`}
        />
        <FieldError message={errors.title?.message} />
      </div>

      {/* ── 대표 이미지 (썸네일) ── */}
      <ThumbnailUpload
        value={thumbnail}
        onChange={setThumbnail}
        label="대표 이미지 (선택) — 목록에서 썸네일로 표시됩니다"
      />

      {/* ── 파일 첨부 ── */}
      <FileAttachmentZone
        initialFiles={attachedFiles}
        onChange={handleFilesChange}
        label="파일 첨부 (선택) — 이미지·PDF·문서 등 모든 파일, 여러 파일 가능"
      />

      {/* ── 내용 ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
        <textarea
          {...contentRegister}
          ref={contentFormRef}
          rows={10}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none"
          placeholder="내용을 입력해주세요"
        />
        <FieldError message={errors.content?.message} />
      </div>

      {/* ── 오류 메시지 ── */}
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* ── 하단 버튼 ── */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1"
          isLoading={isSubmitting || fileUploading}
          disabled={isSubmitting || fileUploading}
        >
          {fileUploading
            ? '파일 업로드 중…'
            : isSubmitting
              ? isEdit ? '수정 중…' : '등록 중…'
              : isEdit ? '수정 완료' : '게시글 등록'}
        </Button>
      </div>
    </form>
  )
}
