'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  isPublished: boolean
  apiUrl: string // e.g. /api/admin/columns/:id
}

export function PublishToggle({ id, isPublished, apiUrl }: Props) {
  const router = useRouter()
  const [current, setCurrent] = useState(isPublished)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const next = !current
      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: next }),
      })
      if (res.ok) {
        setCurrent(next)
        router.refresh()
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={current ? '클릭하면 숨김' : '클릭하면 공개'}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
        current
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current ? 'bg-green-500' : 'bg-gray-400'}`} />
      {isPending ? '...' : current ? '공개' : '숨김'}
    </button>
  )
}

// Variant for items without a dedicated PATCH endpoint — uses the same button style but opens a confirmation
export function UnpublishButton({ id, apiUrl }: { id: string; apiUrl: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function hide() {
    startTransition(async () => {
      await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: false }),
      })
      router.refresh()
    })
  }

  return (
    <button
      onClick={hide}
      disabled={isPending}
      className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      {isPending ? '...' : '숨김'}
    </button>
  )
}
