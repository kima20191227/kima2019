'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnEditor } from './ColumnEditor'

interface InitialData {
  id?: string
  title?: string
  content?: string
  excerpt?: string | null
  thumbnail?: string | null
  imageUrls?: string[]
  fileUrls?: string[]
  tags?: string[]
  authorName?: string | null
}

interface Props {
  initialData?: InitialData
  mode: 'create' | 'edit'
}

export function ColumnWriteForm({ initialData, mode }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [authorName, setAuthorName] = useState(initialData?.authorName ?? '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? '')
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail ?? '')
  const [tagInput, setTagInput] = useState((initialData?.tags ?? []).join(', '))
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls ?? [])
  const [fileUrls, setFileUrls] = useState<string[]>(initialData?.fileUrls ?? [])
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newFileUrl, setNewFileUrl] = useState('')
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

  function addImageUrl() {
    const trimmed = newImageUrl.trim()
    if (trimmed && !imageUrls.includes(trimmed)) {
      setImageUrls((prev) => [...prev, trimmed])
    }
    setNewImageUrl('')
  }

  function addFileUrl() {
    const trimmed = newFileUrl.trim()
    if (trimmed && !fileUrls.includes(trimmed)) {
      setFileUrls((prev) => [...prev, trimmed])
    }
    setNewFileUrl('')
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
      const body = {
        title: title.trim(),
        content,
        authorName: authorName.trim() || null,
        excerpt: excerpt.trim() || null,
        thumbnail: thumbnail.trim() || null,
        tags: parseTags(tagInput),
        imageUrls,
        fileUrls,
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

      {/* Image URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          본문 이미지 URL <span className="text-gray-400 text-xs">(선택 — 별도 저장)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
            placeholder="https://..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
          <button
            type="button"
            onClick={addImageUrl}
            className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
          >
            추가
          </button>
        </div>
        {imageUrls.length > 0 && (
          <ul className="space-y-1">
            {imageUrls.map((url, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex-1 truncate">{url}</span>
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* File URLs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          첨부파일 URL <span className="text-gray-400 text-xs">(선택 — 구글 드라이브 등)</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="url"
            value={newFileUrl}
            onChange={(e) => setNewFileUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFileUrl())}
            placeholder="https://drive.google.com/..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
          <button
            type="button"
            onClick={addFileUrl}
            className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
          >
            추가
          </button>
        </div>
        {fileUrls.length > 0 && (
          <ul className="space-y-1">
            {fileUrls.map((url, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex-1 truncate">{url}</span>
                <button
                  type="button"
                  onClick={() => setFileUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600 flex-shrink-0"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
          disabled={submitting}
          className="px-5 py-2 text-sm bg-[#1B3A6B] text-white rounded-lg hover:bg-[#15305a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '칼럼 등록'}
        </button>
      </div>
    </form>
  )
}
