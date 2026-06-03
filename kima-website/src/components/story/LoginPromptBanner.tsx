'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export function LoginPromptBanner() {
  const { data: session, status } = useSession()
  if (status === 'loading' || session?.user) return null

  return (
    <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
      <Link href="/auth/login" className="font-medium underline">
        로그인
      </Link>
      하시면 질문을 작성하고 답변을 받을 수 있습니다.
    </div>
  )
}
