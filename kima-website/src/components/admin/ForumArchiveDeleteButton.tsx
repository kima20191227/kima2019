'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  archiveId: string
  redirectTo?: string
}

export function ForumArchiveDeleteButton({ archiveId, redirectTo = '/network/archive' }: Props) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleDelete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/forum-archives/${archiveId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push(redirectTo)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? '삭제에 실패했습니다.')
        setConfirm(false)
      }
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <span className="text-xs text-amber-700 font-medium">정말 삭제하시겠습니까?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '삭제 중...' : '확인'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={isPending}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
    >
      삭제
    </button>
  )
}
