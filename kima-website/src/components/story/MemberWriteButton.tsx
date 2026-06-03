'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Props {
  href: string
  label: string
  className?: string
}

export function MemberWriteButton({ href, label, className }: Props) {
  const { data: session } = useSession()
  if (!session?.user) return null

  return (
    <Link
      href={href}
      className={
        className ??
        'shrink-0 px-4 py-2 bg-[#C8922A] text-white text-sm font-semibold rounded-lg hover:bg-[#b07d22] transition-colors'
      }
    >
      {label}
    </Link>
  )
}
