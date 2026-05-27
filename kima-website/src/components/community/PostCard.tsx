import Link from 'next/link'
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
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PostCard({ post, categoryType }: PostCardProps) {
  const isNotice = post.type === 'NOTICE'

  const attList = Array.isArray(post.attachments)
    ? (post.attachments as { url: string; name: string; type: string; isCover?: boolean }[])
    : []
  // 대표이미지(isCover) 우선, 없으면 첫 번째 이미지
  const firstImage =
    attList.find((a) => a.isCover && a.type?.startsWith('image/')) ??
    attList.find((a) => a.type?.startsWith('image/'))

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
          href={`/community/${categoryType}/${post.category.slug}/posts/${post.id}`}
          className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#1B3A6B] transition-colors line-clamp-1"
        >
          {post.title}
        </Link>
        <p className="mt-1 text-xs text-gray-400">
          {post.author.name ?? '알 수 없음'} · {formatDate(post.createdAt)}
        </p>
      </div>
    </div>
  )
}
