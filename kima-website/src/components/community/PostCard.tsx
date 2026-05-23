import Link from 'next/link'
import type { PostType } from '@prisma/client'

type PostWithRelations = {
  id: string
  title: string
  type: PostType
  createdAt: Date
  author: { id: string; name: string | null }
  category: { id: string; name: string; slug: string }
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

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 group">
      {isNotice && (
        <span className="shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-bold bg-[#1B3A6B] text-white">
          공지
        </span>
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
