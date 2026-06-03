'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Props {
  href: string
  label: string
  className?: string
}

export function OfficerWriteButton({ href, label, className }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  if (role !== 'OFFICER' && role !== 'ADMIN') return null

  return (
    <Link
      href={href}
      className={
        className ??
        'shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8922A] hover:bg-[#b07d20] text-white text-sm font-semibold rounded-lg transition-colors'
      }
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </Link>
  )
}
