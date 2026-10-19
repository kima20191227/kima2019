'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ForumPaymentStatus } from '@prisma/client'

const STATUS_OPTIONS: { value: ForumPaymentStatus; label: string }[] = [
  { value: 'PENDING', label: '입금대기' },
  { value: 'CONFIRMED', label: '입금확인' },
  { value: 'CANCELLED', label: '취소' },
]

interface ForumRegistrationStatusFormProps {
  registrationId: string
  currentStatus: ForumPaymentStatus
  currentMemo: string | null
}

export function ForumRegistrationStatusForm({
  registrationId,
  currentStatus,
  currentMemo,
}: ForumRegistrationStatusFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<ForumPaymentStatus>(currentStatus)
  const [memo, setMemo] = useState(currentMemo ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSave = () => {
    setError('')
    setSaved(false)
    startTransition(async () => {
      const res = await fetch(`/api/admin/forum2026/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: status, adminMemo: memo }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? '저장에 실패했습니다.')
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  const dirty = status !== currentStatus || memo !== (currentMemo ?? '')

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value as ForumPaymentStatus); setSaved(false) }}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        disabled={isPending}
        aria-label="입금 상태"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={memo}
        onChange={(e) => { setMemo(e.target.value); setSaved(false) }}
        placeholder="관리 메모"
        maxLength={500}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-40 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        disabled={isPending}
      />

      {dirty && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="text-xs px-2.5 py-1 rounded-lg bg-[#1B3A6B] text-white disabled:opacity-50 hover:bg-[#142d54] transition-colors"
        >
          {isPending ? '저장 중…' : '저장'}
        </button>
      )}

      {saved && !dirty && <span className="text-xs text-green-600">저장됨</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
