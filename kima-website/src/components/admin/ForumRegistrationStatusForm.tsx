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

function nowHHmm() {
  return new Date().toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
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
  // 마지막으로 저장된 값 — 저장 직후 새로고침 전에도 dirty 판정이 맞도록 로컬로 보관
  const [baseline, setBaseline] = useState({ status: currentStatus, memo: currentMemo ?? '' })
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState('')

  const dirty = status !== baseline.status || memo.trim() !== baseline.memo.trim()

  const handleSave = () => {
    setError('')
    setSavedAt(null)
    startTransition(async () => {
      try {
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
        setBaseline({ status, memo: memo.trim() })
        setMemo(memo.trim())
        setSavedAt(nowHHmm())
        router.refresh()
      } catch {
        setError('네트워크 오류로 저장하지 못했습니다.')
      }
    })
  }

  const onEdit = () => {
    setSavedAt(null)
    setError('')
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value as ForumPaymentStatus); onEdit() }}
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
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
        onChange={(e) => { setMemo(e.target.value); onEdit() }}
        placeholder="관리 메모"
        maxLength={500}
        aria-label="관리 메모"
        className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 flex-1 min-w-[10rem] bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        disabled={isPending}
      />

      <button
        type="button"
        onClick={handleSave}
        disabled={!dirty || isPending}
        className="text-sm px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#142d54] transition-colors"
      >
        {isPending ? '저장 중…' : '저장'}
      </button>

      <span role="status" aria-live="polite" className="text-xs">
        {savedAt && !dirty && !isPending && <span className="text-green-700">저장됨 ✓ {savedAt}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </span>
    </div>
  )
}
