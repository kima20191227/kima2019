'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  storyId: string
  backUrl: string
}

export function StoryDeleteButton({ storyId, backUrl }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push(backUrl)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '삭제 중 오류가 발생했습니다.')
        setConfirming(false)
      }
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">정말 삭제하시겠습니까?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '삭제 중...' : '삭제'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
    >
      삭제
    </button>
  )
}
