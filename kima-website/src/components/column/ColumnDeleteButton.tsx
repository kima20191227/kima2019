'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  columnId: string
}

export function ColumnDeleteButton({ columnId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/columns/${columnId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/story/columns')
        router.refresh()
      }
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-sm text-gray-600">정말 삭제하시겠습니까?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? '삭제 중...' : '삭제'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
    >
      삭제
    </button>
  )
}
