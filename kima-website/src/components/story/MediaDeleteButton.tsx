'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  title: string
}

export function MediaDeleteButton({ id, title }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) { setConfirming(true); return }

    setDeleting(true)
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      router.refresh()
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-md shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? '삭제 중' : '확인'}
        </button>
        <button
          onClick={handleCancel}
          className="px-2.5 py-1 bg-white/90 text-gray-600 text-xs font-medium rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      title={`"${title}" 삭제`}
      className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-red-500 text-xs font-medium rounded-md shadow-sm border border-gray-200 hover:bg-red-500 hover:text-white transition-colors"
    >
      삭제
    </button>
  )
}
