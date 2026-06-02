'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PostType } from '@prisma/client'
import { convertDriveUrl } from '@/lib/utils'

type PostWithRelations = {
  id: string
  title: string
  type: PostType
  createdAt: Date
  author: { id: string; name: string | null }
  category: { id: string; name: string; slug: string }
  attachments?: import('@prisma/client').Prisma.JsonValue
}

interface PostCardProps {
  post: PostWithRelations
  categoryType: string
  canManage?: boolean
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PostCard({ post, categoryType, canManage }: PostCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const isNotice = post.type === 'NOTICE'

  const attList = Array.isArray(post.attachments)
    ? (post.attachments as { url: string; name: string; type: string; isCover?: boolean }[])
    : []
  const firstImage =
    attList.find((a) => a.isCover && a.type?.startsWith('image/')) ??
    attList.find((a) => a.type?.startsWith('image/'))

  const detailHref = `/community/${categoryType}/${post.category.slug}/posts/${post.id}`
  const editHref = `${detailHref}/edit`

  const handleDelete = async () => {
    if (!confirm(`"${post.title}" 게시글을 삭제하시겠습니까?`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert((data as { error?: string }).error ?? '삭제에 실패했습니다.')
        setIsDeleting(false)
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 group">
      {isNotice && (
        <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-bold bg-[#1B3A6B] text-white">
          공지
        </span>
      )}
      {firstImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={convertDriveUrl(firstImage.url)}
          alt={firstImage.name}
          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <Link
          href={detailHref}
          className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#1B3A6B] transition-colors line-clamp-1"
        >
          {post.title}
        </Link>
        <p className="mt-1 text-xs text-gray-400">
          {post.author.name ?? '알 수 없음'} · {formatDate(post.createdAt)}
        </p>
      </div>
      {canManage && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Link
            href={editHref}
            className="p-1.5 rounded-md text-gray-400 hover:text-[#1B3A6B] hover:bg-blue-50 transition-colors"
            title="수정"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="삭제"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
