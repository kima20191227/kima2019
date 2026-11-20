'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { GRANTABLE_ADMIN_MENUS } from '@/lib/adminAccess'

interface Props {
  userId: string
  userName: string
  currentMenus: string[]
}

// 임원(OFFICER)에게 열어 줄 관리자 메뉴를 체크박스로 고른다. ADMIN만 이 컴포넌트를 본다.
export function MemberMenuAccess({ userId, userName, currentMenus }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string[]>(currentMenus)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const toggle = (key: string) => {
    setSaved(false)
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const dirty =
    selected.length !== currentMenus.length || selected.some((k) => !currentMenus.includes(k))

  const handleSave = () => {
    setError('')
    setSaved(false)
    startTransition(async () => {
      const res = await fetch(`/api/admin/members/${userId}/menus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menus: selected }),
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

  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-[#1B3A6B] font-medium select-none">
        관리자 메뉴 권한 ({currentMenus.length}개 부여)
      </summary>
      <div className="mt-2 p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-2 max-w-xs">
        <p className="text-gray-500">{userName}님에게 열어 줄 관리자 메뉴를 선택하세요.</p>
        <div className="grid grid-cols-1 gap-1.5">
          {GRANTABLE_ADMIN_MENUS.map((m) => (
            <label key={m.key} className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(m.key)}
                onChange={() => toggle(m.key)}
                disabled={isPending}
                className="accent-[#1B3A6B]"
              />
              {m.label}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !dirty}
            className="px-2.5 py-1 rounded-lg bg-[#1B3A6B] text-white disabled:opacity-40 hover:bg-[#142d54] transition-colors"
          >
            {isPending ? '저장 중…' : '권한 저장'}
          </button>
          {saved && <span className="text-green-600">저장됨</span>}
          {error && <span className="text-red-500">{error}</span>}
        </div>
      </div>
    </details>
  )
}
