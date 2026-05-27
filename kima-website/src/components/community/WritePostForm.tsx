'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postSchema, type PostInput, type PostAttachment } from '@/schemas/post.schema'
import { FieldError } from '@/components/auth/FieldError'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// ─── 내부 첨부 상태 타입 ─────────────────────────────────────────────────────

interface AttachItem {
  id: string
  name: string
  mimeType: string
  /** blob: URL (로컬 미리보기) 또는 기존 서버 URL */
  localUrl: string
  /** 업로드 완료 후 서버 URL */
  serverUrl?: string
  isCover: boolean
  status: 'uploading' | 'done' | 'error'
  errorMsg?: string
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

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
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const isEdit = mode === 'edit'

  // 기존 첨부파일을 AttachItem 형식으로 초기화
  const [items, setItems] = useState<AttachItem[]>(() =>
    (initialValues?.attachments ?? []).map((att) => ({
      id: makeId(),
      name: att.name,
      mimeType: att.type,
      localUrl: att.url,
      serverUrl: att.url,
      isCover: att.isCover ?? false,
      status: 'done' as const,
    }))
  )

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    defaultValues: isEdit && initialValues
      ? { categoryId, type: initialValues.type, title: initialValues.title, content: initialValues.content }
      : { categoryId, type: 'SHARE', content: '' },
  })

  const { ref: contentFormRef, ...contentRegister } = register('content')

  const isUploading = items.some((i) => i.status === 'uploading')

  // ─── 파일 1개 업로드 ───────────────────────────────────────────────────────

  const uploadFile = useCallback(async (id: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/upload/resource', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setItems((p) =>
          p.map((i) =>
            i.id === id
              ? { ...i, status: 'error' as const, errorMsg: (data as { error?: string }).error ?? '업로드 실패' }
              : i
          )
        )
        return
      }
      const { url } = (await res.json()) as { url: string }
      setItems((p) =>
        p.map((i) => (i.id === id ? { ...i, status: 'done' as const, serverUrl: url } : i))
      )
    } catch {
      setItems((p) =>
        p.map((i) =>
          i.id === id ? { ...i, status: 'error' as const, errorMsg: '네트워크 오류' } : i
        )
      )
    }
  }, [])

  // ─── 파일 추가 처리 ────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return
      // 새 AttachItem 생성 (ID 고정)
      const newItems: AttachItem[] = files.map((f) => ({
        id: makeId(),
        name: f.name,
        mimeType: f.type || 'application/octet-stream',
        localUrl: isImage(f.type) ? URL.createObjectURL(f) : '',
        isCover: false,
        status: 'uploading' as const,
      }))

      setItems((prev) => {
        // 기존 대표이미지 없으면 첫 번째 이미지를 대표로 자동 지정
        const hasExistingCover = prev.some((i) => i.isCover)
        if (!hasExistingCover) {
          const firstImgIdx = newItems.findIndex((i) => isImage(i.mimeType))
          if (firstImgIdx >= 0) {
            return [
              ...prev,
              ...newItems.map((item, i) =>
                i === firstImgIdx ? { ...item, isCover: true } : item
              ),
            ]
          }
        }
        return [...prev, ...newItems]
      })

      // 각 파일 업로드 시작 (ID는 newItems에서 읽음, setItems 이후에도 동일)
      files.forEach((f, idx) => uploadFile(newItems[idx].id, f))
    },
    [uploadFile]
  )

  // ─── 이벤트 핸들러 ─────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const setCover = (id: string) => {
    setItems((p) => p.map((i) => ({ ...i, isCover: i.id === id })))
  }

  const removeItem = (id: string) => {
    setItems((p) => {
      const found = p.find((i) => i.id === id)
      if (found?.localUrl?.startsWith('blob:')) URL.revokeObjectURL(found.localUrl)

      const remaining = p.filter((i) => i.id !== id)

      // 삭제한 항목이 대표이미지였으면 첫 번째 이미지를 새 대표로 지정
      if (found?.isCover) {
        const firstImgIdx = remaining.findIndex((i) => isImage(i.mimeType))
        if (firstImgIdx >= 0) {
          return remaining.map((i, idx) => ({ ...i, isCover: idx === firstImgIdx }))
        }
      }
      return remaining
    })
  }

  const insertImageInContent = (item: AttachItem) => {
    const url = item.serverUrl ?? item.localUrl
    if (!url || !isImage(item.mimeType)) return
    const textarea = contentRef.current
    const current = getValues('content') ?? ''
    const pos = textarea?.selectionStart ?? current.length
    const tag = `\n[img:${item.name}](${url})\n`
    setValue('content', current.slice(0, pos) + tag + current.slice(pos), { shouldDirty: true })
    setTimeout(() => {
      if (textarea) {
        const newPos = pos + tag.length
        textarea.focus()
        textarea.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  // ─── 제출 ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: PostInput) => {
    if (isUploading) {
      setServerError('사진 업로드가 완료될 때까지 기다려주세요.')
      return
    }
    setServerError(null)

    const attachments: PostAttachment[] = items
      .filter((i) => i.status === 'done' && i.serverUrl)
      .map((i) => ({ url: i.serverUrl!, name: i.name, type: i.mimeType, isCover: i.isCover }))

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

  const imageItems = items.filter((i) => isImage(i.mimeType))
  const fileItems = items.filter((i) => !isImage(i.mimeType))

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

      {/* ── 사진 첨부 ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사진 첨부{' '}
          <span className="text-xs text-gray-400 font-normal">
            (JPG · PNG · WebP · 최대 10MB · 최대 20장)
          </span>
        </label>

        {/* 드래그앤드롭 영역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl py-8 px-4 text-center cursor-pointer transition-all select-none',
            isDragging
              ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 scale-[1.01]'
              : 'border-gray-200 hover:border-[#1B3A6B]/50 hover:bg-gray-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
            aria-label="사진 파일 선택"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-[#1B3A6B]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 12V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18v-6z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              사진을 여기에 끌어다 놓거나 <span className="text-[#1B3A6B] underline">클릭하여 선택</span>
            </p>
            <p className="text-xs text-gray-400">여러 장 동시 선택 가능</p>
          </div>
        </div>

        {/* 이미지 그리드 미리보기 */}
        {imageItems.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">
              사진 {imageItems.length}장
              {imageItems.filter((i) => i.status === 'uploading').length > 0 && (
                <span className="ml-2 text-amber-600">
                  · {imageItems.filter((i) => i.status === 'uploading').length}장 업로드 중…
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {imageItems.map((item) => (
                <PhotoCard
                  key={item.id}
                  item={item}
                  onSetCover={() => setCover(item.id)}
                  onInsert={() => insertImageInContent(item)}
                  onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              * 썸네일에 마우스를 올리면 대표이미지 설정 · 본문 삽입 · 삭제 버튼이 나타납니다.
            </p>
          </div>
        )}

        {/* 파일(비이미지) 목록 */}
        {fileItems.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {fileItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1B3A6B]/10 flex-shrink-0">
                  <svg className="w-4 h-4 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <span className="flex-1 text-xs text-gray-600 truncate">{item.name}</span>
                {item.status === 'uploading' && (
                  <div className="w-4 h-4 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                {item.status === 'error' && (
                  <span className="text-xs text-red-500 flex-shrink-0">{item.errorMsg}</span>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="삭제"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── 내용 ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
        <p className="text-xs text-gray-400 mb-2">
          사진을 첨부 후 각 사진의 &apos;본문에 삽입&apos; 버튼을 누르면 본문에 이미지가 포함됩니다.
        </p>
        <textarea
          {...contentRegister}
          ref={(el) => {
            contentFormRef(el)
            contentRef.current = el
          }}
          rows={10}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none"
          placeholder="내용을 입력해주세요 (사진만 올리는 게시글도 가능합니다)"
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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          취소
        </Button>
        <Button
          type="submit"
          className="flex-1"
          isLoading={isSubmitting || isUploading}
          disabled={isSubmitting || isUploading}
        >
          {isUploading
            ? '사진 업로드 중…'
            : isSubmitting
              ? isEdit ? '수정 중…' : '등록 중…'
              : isEdit ? '수정 완료' : '게시글 등록'}
        </Button>
      </div>
    </form>
  )
}

// ─── 사진 카드 (그리드 각 셀) ──────────────────────────────────────────────────

interface PhotoCardProps {
  item: AttachItem
  onSetCover: () => void
  onInsert: () => void
  onRemove: () => void
}

function PhotoCard({ item, onSetCover, onInsert, onRemove }: PhotoCardProps) {
  const previewSrc = item.localUrl || ''

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-100 group">
      {/* 이미지 */}
      {previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt={item.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 12V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18v-6z" />
          </svg>
        </div>
      )}

      {/* 대표이미지 뱃지 */}
      {item.isCover && (
        <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-[#C8922A] text-white text-[10px] font-bold shadow-sm">
          대표
        </span>
      )}

      {/* 업로드 중 오버레이 */}
      {item.status === 'uploading' && (
        <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      {/* 오류 오버레이 */}
      {item.status === 'error' && (
        <div className="absolute inset-0 z-10 bg-red-900/80 flex flex-col items-center justify-center gap-2 p-2">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-white text-[10px] text-center leading-tight line-clamp-2">
            {item.errorMsg ?? '업로드 실패'}
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            삭제
          </button>
        </div>
      )}

      {/* 호버 액션 (업로드 완료 상태) */}
      {item.status === 'done' && (
        <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/50 transition-all duration-150 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
          {!item.isCover && (
            <button
              type="button"
              onClick={onSetCover}
              className="text-[11px] px-2.5 py-1 rounded-full bg-[#C8922A] text-white font-medium hover:bg-[#b07a20] transition-colors whitespace-nowrap shadow-sm"
            >
              대표이미지 설정
            </button>
          )}
          <button
            type="button"
            onClick={onInsert}
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#1B3A6B] text-white font-medium hover:bg-[#142d54] transition-colors whitespace-nowrap shadow-sm"
          >
            본문에 삽입
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/20 text-white font-medium hover:bg-red-500 transition-colors whitespace-nowrap shadow-sm"
          >
            삭제
          </button>
        </div>
      )}

      {/* 파일명 (하단 그라데이션) */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pt-4 pb-1.5 px-2 pointer-events-none">
        <p className="text-white text-[10px] truncate leading-tight">{item.name}</p>
      </div>
    </div>
  )
}
