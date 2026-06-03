'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NoticeWriteForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    tags: '',
    isImportant: false,
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
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NOTICE',
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          tags,
          images: [],
          videoUrls: [],
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '서버 오류')
      }
      router.push('/story/notice')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      {/* 중요 공지 체크 */}
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

      {/* 제목 */}
      <div>
        <label htmlFor="notice-title" className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
        <input
          id="notice-title"
          required
          maxLength={200}
          placeholder="공지 제목을 입력하세요"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 한줄 요약 */}
      <div>
        <label htmlFor="notice-excerpt" className="block text-sm font-medium text-gray-700 mb-1">
          한줄 요약 <span className="text-gray-400 font-normal">(선택 — 목록에 표시됩니다)</span>
        </label>
        <input
          id="notice-excerpt"
          maxLength={200}
          placeholder="공지 내용을 한 줄로 요약해 주세요"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 본문 */}
      <div>
        <label htmlFor="notice-content" className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
        <textarea
          id="notice-content"
          required
          rows={12}
          placeholder="공지 내용을 입력하세요."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
        />
      </div>

      {/* 태그 */}
      <div>
        <label htmlFor="notice-tags" className="block text-sm font-medium text-gray-700 mb-1">
          태그 <span className="text-gray-400 font-normal">(선택, 쉼표로 구분)</span>
        </label>
        <input
          id="notice-tags"
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
          {submitting ? '등록 중...' : '공지 등록하기'}
        </button>
      </div>
    </form>
  )
}
