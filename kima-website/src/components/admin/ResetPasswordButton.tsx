'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  userName: string
}

export function ResetPasswordButton({ userId, userName }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/members/${userId}/reset-password`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        alert(json.message ?? '비밀번호가 kima123456으로 초기화되었습니다.')
        router.refresh()
      } else {
        alert(json.error ?? '초기화 중 오류가 발생했습니다.')
      }
    } catch {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
          {userName} 초기화?
        </span>
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="px-2 py-0.5 rounded text-xs bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? '처리 중…' : '확인'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2 py-0.5 rounded text-xs border border-gray-300 text-gray-500 hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      title="비밀번호를 kima123456으로 초기화"
      className="px-2 py-0.5 rounded text-xs border border-orange-200 text-orange-500 hover:bg-orange-50 hover:border-orange-400 transition-colors whitespace-nowrap"
    >
      PW초기화
    </button>
  )
}
