'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnEditor } from '@/components/column/ColumnEditor'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

interface StoryData {
  id: string
  title: string
  content: string
  excerpt: string | null
  authorName: string | null
  ministryLocation: string | null
  videoUrls: string[]
  tags: string[]
  thumbnail?: string | null
  images?: string[]
  attachments?: { url: string; name: string; type: string; isCover?: boolean }[] | null
}

function buildInitialFiles(story: StoryData): AttachedFile[] {
  if (story.attachments && story.attachments.length > 0) {
    return story.attachments.map((a) => ({ url: a.url, name: a.name, type: a.type, isCover: a.isCover }))
  }
  // 구 데이터: attachments 없이 images만 있는 글은 thumbnail로 대표를 복원한다.
  return (story.images ?? []).map((url) => ({
    url,
    name: '이미지',
    type: 'image/*',
    isCover: story.thumbnail ? url === story.thumbnail : undefined,
  }))
}

export function RestWalkEditForm({ story }: { story: StoryData }) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: story.title,
    content: story.content,
    excerpt: story.excerpt ?? '',
    authorName: story.authorName ?? '',
    ministryLocation: story.ministryLocation ?? '',
    videoUrls: story.videoUrls.join('\n'),
    tags: story.tags.join(', '),
  })
  const [attachments, setAttachments] = useState<AttachedFile[]>(() => buildInitialFiles(story))
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleContentChange = useCallback((html: string) => {
    setForm((prev) => ({ ...prev, content: html }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim() || form.content === '<p></p>') {
      setError('본문을 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const images = attachments.filter((a) => a.type.startsWith('image/')).map((a) => a.url)
      const coverImage = attachments.find((a) => a.isCover && a.type.startsWith('image/'))
      const firstImage = attachments.find((a) => a.type.startsWith('image/'))
      const thumbnail = coverImage?.url ?? firstImage?.url ?? null

      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          authorName: form.authorName || null,
          ministryLocation: form.ministryLocation || null,
          thumbnail,
          images,
          attachments,
          videoUrls: form.videoUrls.split('\n').map((v) => v.trim()).filter(Boolean),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '서버 오류')
      }
      router.push(`/story/${story.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
        <input
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="글 제목을 입력하세요"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 한줄 요약 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">한줄 요약 (선택)</label>
        <input
          maxLength={200}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="목록에 표시될 짧은 설명"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 본문 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
        <ColumnEditor
          content={form.content}
          onChange={handleContentChange}
          placeholder="이야기를 자유롭게 써주세요."
        />
      </div>

      {/* 작성자 / 사역지 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">작성자 이름 (선택)</label>
          <input
            maxLength={50}
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            placeholder="실명·이니셜·익명 가능"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">소속·사역지 (선택)</label>
          <input
            maxLength={100}
            value={form.ministryLocation}
            onChange={(e) => setForm({ ...form, ministryLocation: e.target.value })}
            placeholder="예: 서울, A교회"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
        </div>
      </div>

      {/* 영상 링크 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">영상 링크 (선택, 여러 개는 줄바꿈)</label>
        <textarea
          rows={3}
          value={form.videoUrls}
          onChange={(e) => setForm({ ...form, videoUrls: e.target.value })}
          placeholder="유튜브·Vimeo 링크를 한 줄씩 입력하세요"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
        />
      </div>

      {/* 사진·자료 첨부 */}
      <div>
        <FileAttachmentZone
          label="사진·자료 첨부 (선택) — 이미지·PDF·문서"
          initialFiles={attachments}
          onChange={(files, uploading) => {
            setAttachments(files)
            setIsUploading(uploading)
          }}
        />
        <p className="text-xs text-gray-400 mt-1.5">첫 번째 이미지(또는 &apos;대표 설정&apos; 이미지)가 썸네일로 사용됩니다.</p>
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">태그 (선택, 쉼표로 구분)</label>
        <input
          maxLength={200}
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="예: 묵상, 여행, 음악"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || isUploading}
          className="flex-1 py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50 text-sm"
        >
          {isUploading ? '업로드 중...' : submitting ? '저장 중...' : '수정 완료'}
        </button>
      </div>
    </form>
  )
}
