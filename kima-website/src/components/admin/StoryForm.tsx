'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type StoryType = 'NEWS' | 'EVENT_MEDIA'

const EMPTY = {
  type: 'NEWS' as StoryType,
  title: '',
  content: '',
  excerpt: '',
  linkUrl: '',
  source: '',
  publishedAt: '',
  eventLocation: '',
  videoUrls: '',
  tags: '',
}

const TYPE_LABELS: Record<StoryType, string> = {
  NEWS:        '📰 KIMA 뉴스',
  EVENT_MEDIA: '📸 행사 사진&영상',
}

export function StoryForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [pendingImages, setPendingImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const MAX_FILES = 20

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPendingImages((prev) => {
      const next = [...prev, ...files].slice(0, MAX_FILES)
      return next
    })
    setPreviewUrls((prev) => {
      const newUrls = files.map((f) => URL.createObjectURL(f))
      return [...prev, ...newUrls].slice(0, MAX_FILES)
    })
    e.target.value = ''
  }, [])

  const removeImage = useCallback((i: number) => {
    setPendingImages((prev) => prev.filter((_, idx) => idx !== i))
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[i])
      return prev.filter((_, idx) => idx !== i)
    })
  }, [])

  const reset = () => {
    previewUrls.forEach((u) => URL.revokeObjectURL(u))
    setForm(EMPTY)
    setPendingImages([])
    setPreviewUrls([])
    setError('')
    setUploadProgress('')
    setOpen(false)
  }

  const handleSubmit = () => {
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!form.content.trim()) { setError('내용을 입력해주세요.'); return }
    if (form.type === 'NEWS' && !form.linkUrl.trim()) { setError('뉴스 링크 URL을 입력해주세요.'); return }
    setError('')

    startTransition(async () => {
      try {
        let imageUrls: string[] = []

        if (form.type === 'EVENT_MEDIA' && pendingImages.length > 0) {
          // 한 장씩 순차 업로드 (Cloudflare Workers 요청 크기 제한 회피)
          for (let i = 0; i < pendingImages.length; i++) {
            setUploadProgress(`사진 업로드 중… (${i + 1}/${pendingImages.length}장)`)
            const fd = new FormData()
            fd.append('files', pendingImages[i])
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!uploadRes.ok) {
              const d = await uploadRes.json().catch(() => ({}))
              setUploadProgress('')
              setError(d.error ?? `사진 ${i + 1}번 업로드에 실패했습니다. (HTTP ${uploadRes.status})`)
              return
            }
            const data = await uploadRes.json()
            imageUrls.push(...(data.urls ?? []))
          }
          setUploadProgress('')
        }

        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type:          form.type,
            title:         form.title,
            content:       form.content,
            excerpt:       form.excerpt || undefined,
            linkUrl:       form.linkUrl || undefined,
            source:        form.source || undefined,
            publishedAt:   form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
            eventLocation: form.eventLocation || undefined,
            videoUrls:     form.videoUrls.split('\n').map((v) => v.trim()).filter(Boolean),
            images:        imageUrls,
            tags:          form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? '등록에 실패했습니다.')
          return
        }
        reset()
        router.refresh()
      } catch (err) {
        setUploadProgress('')
        setError(err instanceof Error ? err.message : '등록 중 오류가 발생했습니다.')
      }
    })
  }

  const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] transition-colors mb-6"
      >
        + 스토리 등록
      </button>
    )
  }

  const isLoading = isPending || !!uploadProgress

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
      <h3 className="font-semibold text-gray-800">새 스토리 등록</h3>

      {/* 타입 선택 */}
      <div className="flex gap-3">
        {(Object.keys(TYPE_LABELS) as StoryType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => set('type', t)}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
              form.type === t
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">제목 *</label>
        <input
          title="제목"
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className={inputClass}
          disabled={isLoading}
        />
      </div>

      {/* NEWS 전용 필드 */}
      {form.type === 'NEWS' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">뉴스 링크 URL *</label>
            <input
              title="뉴스 링크 URL"
              type="url"
              value={form.linkUrl}
              onChange={(e) => set('linkUrl', e.target.value)}
              placeholder="https://..."
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">출처 (선택)</label>
              <input
                title="출처"
                type="text"
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                placeholder="예: 기독일보"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">발행일 (선택)</label>
              <input
                title="발행일"
                type="date"
                value={form.publishedAt}
                onChange={(e) => set('publishedAt', e.target.value)}
                className={inputClass}
                disabled={isLoading}
              />
            </div>
          </div>
        </>
      )}

      {/* EVENT_MEDIA 전용 필드 */}
      {form.type === 'EVENT_MEDIA' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">행사 날짜 (선택)</label>
            <input
              title="행사 날짜"
              type="date"
              value={form.publishedAt}
              onChange={(e) => set('publishedAt', e.target.value)}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">장소 (선택)</label>
            <input
              title="장소"
              type="text"
              value={form.eventLocation}
              onChange={(e) => set('eventLocation', e.target.value)}
              placeholder="예: 서울 강남구 OO교회"
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">사진 업로드 (선택)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              title="사진 파일 선택"
              aria-label="사진 파일 선택"
              className="hidden"
              onChange={handleImageSelect}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || pendingImages.length >= MAX_FILES}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors disabled:opacity-50"
            >
              📷 사진 선택 (최대 {MAX_FILES}장)
            </button>

            {previewUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square">
                    <Image
                      src={url}
                      alt={`미리보기 ${i + 1}`}
                      fill
                      className="object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      disabled={isLoading}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {pendingImages.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {pendingImages.length}장 선택됨 — 등록 시 업로드됩니다.
                {pendingImages.length >= MAX_FILES && (
                  <span className="text-amber-600"> (최대 {MAX_FILES}장)</span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">동영상 링크 (선택, 줄바꿈으로 구분)</label>
            <textarea
              title="동영상 링크"
              value={form.videoUrls}
              onChange={(e) => set('videoUrls', e.target.value)}
              rows={2}
              placeholder="https://youtube.com/..."
              className={`${inputClass} resize-none`}
              disabled={isLoading}
            />
          </div>
        </>
      )}

      {/* 내용 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">내용 / 설명 *</label>
        <textarea
          title="내용"
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          rows={4}
          className={`${inputClass} resize-y`}
          disabled={isLoading}
        />
      </div>

      {/* 한줄 요약 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">한줄 요약 (선택)</label>
        <input
          title="한줄 요약"
          type="text"
          value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          placeholder="목록에 표시될 짧은 설명"
          className={inputClass}
          disabled={isLoading}
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">태그 (선택, 쉼표로 구분)</label>
        <input
          title="태그"
          type="text"
          value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="예: 이주민, 선교, 2024"
          className={inputClass}
          disabled={isLoading}
        />
      </div>

      {uploadProgress && (
        <p className="text-xs text-blue-600 font-medium">{uploadProgress}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {uploadProgress ? '업로드 중…' : isPending ? '등록 중…' : '등록'}
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}
