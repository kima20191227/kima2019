'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnEditor } from '@/components/column/ColumnEditor'

interface StoryData {
  id: string
  title: string
  content: string
  excerpt: string | null
  authorName: string | null
  ministryLocation: string | null
  videoUrls: string[]
  tags: string[]
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
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          authorName: form.authorName || null,
          ministryLocation: form.ministryLocation || null,
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
          disabled={submitting}
          className="flex-1 py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50 text-sm"
        >
          {submitting ? '저장 중...' : '수정 완료'}
        </button>
      </div>
    </form>
  )
}
