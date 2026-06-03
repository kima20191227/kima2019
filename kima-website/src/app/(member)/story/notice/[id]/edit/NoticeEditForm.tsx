'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NoticeStory {
  id: string
  title: string
  content: string
  excerpt: string | null
  tags: string[]
}

export function NoticeEditForm({ notice }: { notice: NoticeStory }) {
  const router = useRouter()
  const isImportantInit = notice.tags.includes('중요')
  const otherTags = notice.tags.filter((t) => t !== '중요')

  const [form, setForm] = useState({
    title: notice.title,
    content: notice.content,
    excerpt: notice.excerpt ?? '',
    tags: otherTags.join(', '),
    isImportant: isImportantInit,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const tags = [
      ...(form.isImportant ? ['중요'] : []),
      ...form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    ]

    try {
      const res = await fetch(`/api/stories/${notice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          tags,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '서버 오류')
      }
      router.push(`/story/notice/${notice.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isImportant}
          onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 accent-red-600"
        />
        <span className="text-sm font-medium text-gray-700">
          중요 공지로 표시
          <span className="ml-1.5 px-1.5 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded">중요</span>
        </span>
      </label>

      <div>
        <label htmlFor="edit-notice-title" className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
        <input
          id="edit-notice-title"
          required
          maxLength={200}
          placeholder="공지 제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      <div>
        <label htmlFor="edit-notice-excerpt" className="block text-sm font-medium text-gray-700 mb-1">
          한줄 요약 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <input
          id="edit-notice-excerpt"
          maxLength={200}
          placeholder="목록에 표시될 짧은 설명"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      <div>
        <label htmlFor="edit-notice-content" className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
        <textarea
          id="edit-notice-content"
          required
          rows={12}
          placeholder="공지 내용"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
        />
      </div>

      <div>
        <label htmlFor="edit-notice-tags" className="block text-sm font-medium text-gray-700 mb-1">
          태그 <span className="text-gray-400 font-normal">(선택, 쉼표로 구분)</span>
        </label>
        <input
          id="edit-notice-tags"
          maxLength={200}
          placeholder="예: 행사안내, 회원모집"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
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
          className="flex-[2] py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50 text-sm"
        >
          {submitting ? '저장 중...' : '수정 완료'}
        </button>
      </div>
    </form>
  )
}
