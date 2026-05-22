import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WritePostForm } from '@/components/community/WritePostForm'
import type { Metadata } from 'next'
import type { CategoryType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const URL_TO_DB: Record<string, CategoryType> = {
  region: 'REGION',
  language: 'LANGUAGE',
  target: 'TARGET',
}

interface Props {
  params: Promise<{ type: string; slug: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id }, select: { title: true } })
  if (!post) return { title: '게시글 수정 | KIMA' }
  return { title: `${post.title} 수정 | KIMA` }
}

export default async function EditPostPage({ params }: Props) {
  const { type, slug, id } = await params
  const dbType = URL_TO_DB[type]
  if (!dbType) notFound()

  const [session, post] = await Promise.all([
    auth(),
    prisma.post.findUnique({
      where: { id, isPublished: true },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, type: true, name: true, slug: true } },
      },
    }),
  ])

  if (!post || post.category.slug !== slug || post.category.type !== dbType) notFound()

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/community/${type}/${slug}/posts/${id}/edit`)
  }

  const ROLE_WEIGHT: Record<string, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }
  const roleWeight = ROLE_WEIGHT[session.user.role] ?? 0
  const isAuthor = session.user.id === post.authorId
  const isAdmin = roleWeight >= 4

  if (!isAuthor && !isAdmin) {
    redirect(`/community/${type}/${slug}/posts/${id}`)
  }

  const canWriteNotice = roleWeight >= 3

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/community/${type}/${slug}/posts/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B3A6B] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          게시글로 돌아가기
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1B3A6B]">게시글 수정</h1>
          <p className="mt-1 text-sm text-gray-500">{post.category.name} 카테고리의 게시글을 수정합니다.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <WritePostForm
            categoryId={post.category.id}
            categoryName={post.category.name}
            categoryType={type}
            categorySlug={slug}
            canWriteNotice={canWriteNotice}
            mode="edit"
            postId={id}
            initialValues={{
              title: post.title,
              content: post.content,
              type: post.type,
            }}
          />
        </div>
      </div>
    </div>
  )
}
