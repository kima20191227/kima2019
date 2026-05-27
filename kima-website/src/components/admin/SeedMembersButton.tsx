'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function SeedMembersButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState('')

  const handleSeed = () => {
    if (!confirm('기존 JSON 데이터의 130명 회원 데이터를 사역지도(Organization)에 등록합니다. 계속할까요?')) return
    startTransition(async () => {
      const res = await fetch('/api/admin/seed-members', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMsg(`완료 — 신규 ${data.created}개 등록, ${data.skipped}개 건너뜀`)
        router.refresh()
      } else {
        setMsg(data.error ?? '오류 발생')
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSeed}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
      >
        {isPending ? '등록 중…' : '🗺️ 정회원 130명 사역지도 등록'}
      </button>
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  )
}
