'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface InitialData {
  id?: string
  title?: string
  content?: string
}

interface Props {
  initialData?: InitialData
  mode: 'create' | 'edit'
}

export function QuestionWriteForm({ initialData, mode }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    if (content.trim().length < 10) {
      setError('내용은 10자 이상 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      const url = mode === 'edit' ? `/api/questions/${initialData!.id}` : '/api/questions'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '저장 중 오류가 발생했습니다.')
        return
      }

      const data = await res.json()
      const targetId = mode === 'edit' ? initialData!.id : data.question.id
      router.push(`/story/qna/${targetId}`)
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="질문 제목을 입력해주세요"
          maxLength={200}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 내용 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="질문 내용을 자세히 입력해주세요 (10자 이상)"
          rows={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
        <p className="mt-1 text-xs text-gray-400 text-right">{content.length}자</p>
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* 버튼 */}
      <div className="flex gap-3 justify-end pt-1">
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
          {submitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '질문 등록'}
        </button>
      </div>
    </form>
  )
}
