'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MediaDeleteButton } from './MediaDeleteButton'

interface Props {
  id: string
  title: string
}

export function MediaCardActions({ id, title }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  if (role !== 'OFFICER' && role !== 'ADMIN') return null

  return (
    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Link
        href={`/story/media/${id}/edit`}
        className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[#1B3A6B] text-xs font-medium rounded-md shadow-sm border border-gray-200 hover:bg-[#1B3A6B] hover:text-white transition-colors"
      >
        수정
      </Link>
      <MediaDeleteButton id={id} title={title} />
    </div>
  )
}
