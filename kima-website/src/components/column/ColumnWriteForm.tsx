'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnEditor } from './ColumnEditor'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

interface InitialData {
  id?: string
  title?: string
  content?: string
  excerpt?: string | null
  thumbnail?: string | null
  imageUrls?: string[]
  fileUrls?: string[]
  attachments?: { url: string; name: string; type: string; isCover?: boolean }[] | null
  tags?: string[]
  authorName?: string | null
}

interface Props {
  initialData?: InitialData
  mode: 'create' | 'edit'
}

function buildInitialFiles(initialData?: InitialData): AttachedFile[] {
  if (initialData?.attachments && initialData.attachments.length > 0) {
    return initialData.attachments.map((a) => ({ url: a.url, name: a.name, type: a.type, isCover: a.isCover }))
  }
  // 구 데이터: attachments 없이 imageUrls만 있는 글은 thumbnail로 대표를 복원한다.
  const fromImages = (initialData?.imageUrls ?? []).map((url) => ({
    url,
    name: '이미지',
    type: 'image/*',
    isCover: initialData?.thumbnail ? url === initialData.thumbnail : undefined,
  }))
  const fromFiles = (initialData?.fileUrls ?? []).map((url) => ({
    url,
    name: '첨부파일',
    type: 'application/octet-stream',
  }))
  return [...fromImages, ...fromFiles]
}

export function ColumnWriteForm({ initialData, mode }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [authorName, setAuthorName] = useState(initialData?.authorName ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail ?? '')
  const [tagInput, setTagInput] = useState((initialData?.tags ?? []).join(', '))
  const [attachments, setAttachments] = useState<AttachedFile[]>(() => buildInitialFiles(initialData))
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleContentChange = useCallback((html: string) => {
    setContent(html)
  }, [])

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (!content.trim() || content === '<p></p>') {
      setError('본문을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const imageUrls = attachments.filter((a) => a.type.startsWith('image/')).map((a) => a.url)
      const fileUrls = attachments.filter((a) => !a.type.startsWith('image/')).map((a) => a.url)
      const coverImage = attachments.find((a) => a.isCover && a.type.startsWith('image/'))
      // 직접 입력한 대표 이미지 URL이 최우선, 없으면 '대표 설정' 이미지, 그 다음 첫 이미지
      const resolvedThumbnail = thumbnail.trim() || coverImage?.url || imageUrls[0] || null

      const body = {
        title: title.trim(),
        content,
        authorName: authorName.trim() || null,
        excerpt: excerpt.trim() || null,
        thumbnail: resolvedThumbnail,
        tags: parseTags(tagInput),
        imageUrls,
        fileUrls,
        attachments,
      }

      const url = mode === 'edit' ? `/api/columns/${initialData!.id}` : '/api/columns'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '저장 중 오류가 발생했습니다.')
        return
      }

      const data = await res.json()
      router.push(`/story/columns/${data.column.id}`)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="칼럼 제목을 입력해주세요"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          maxLength={200}
        />
      </div>

      {/* Author Name (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          작성자 <span className="text-gray-400 text-xs">(선택 — 미입력 시 계정 이름 표시)</span>
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="표시할 작성자 이름"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          maxLength={100}
        />
      </div>

      {/* Content (Tiptap) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          본문 <span className="text-red-500">*</span>
        </label>
        <ColumnEditor content={content} onChange={handleContentChange} />
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          요약 <span className="text-gray-400 text-xs">(선택 — 목록에 표시)</span>
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="칼럼 요약을 입력해주세요 (최대 300자)"
          rows={2}
          maxLength={300}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
        />
      </div>

      {/* Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          대표 이미지 URL <span className="text-gray-400 text-xs">(선택)</span>
        </label>
        <input
          type="url"
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
          placeholder="https://..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          태그 <span className="text-gray-400 text-xs">(쉼표로 구분)</span>
        </label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="이주민, 사역, 칼럼"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 사진·자료 첨부 */}
      <FileAttachmentZone
        label="사진·자료 첨부 (선택) — 이미지·PDF·문서"
        initialFiles={attachments}
        onChange={(files, uploading) => {
          setAttachments(files)
          setIsUploading(uploading)
        }}
      />

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || isUploading}
          className="px-5 py-2 text-sm bg-[#1B3A6B] text-white rounded-lg hover:bg-[#15305a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? '업로드 중...' : submitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '칼럼 등록'}
        </button>
      </div>
    </form>
  )
}
