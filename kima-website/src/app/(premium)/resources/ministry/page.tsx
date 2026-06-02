import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ministryResourceWhere } from '@/lib/resourceFilters'
import { ResourcesPageClient } from '@/components/resources/ResourcesPageClient'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { CategoryType, UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '사역 자료 | KIMA 자료실',
  description: '지역별·언어권별·사역대상별 이주민 사역 자료를 공유합니다.',
}

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }
const CATEGORY_TYPE_URL: Record<CategoryType, string> = {
  REGION: 'region',
  LANGUAGE: 'language',
  TARGET: 'target',
}

type PostAttachment = {
  url: string
  name?: string
  type?: string
  isCover?: boolean
}

function getPostAttachments(value: unknown): PostAttachment[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is PostAttachment => (
    typeof item === 'object'
    && item !== null
    && typeof (item as PostAttachment).url === 'string'
  ))
}

function getPostThumbnail(attachments: PostAttachment[]): string | null {
  const image =
    attachments.find((item) => item.isCover && item.type?.startsWith('image/'))
    ?? attachments.find((item) => item.type?.startsWith('image/'))
  return image?.url ?? null
}

function toExcerpt(content: string): string | null {
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return null
  return text.length > 120 ? `${text.slice(0, 120)}...` : text
}

function getUserAccessLevel(
  role?: UserRole,
  expiresAt?: string | null,
): 'none' | 'member' | 'premium' {
  const weight = role ? (ROLE_WEIGHT[role] ?? 0) : 0
  if (weight >= 3) return 'premium'
  if (weight >= 2) {
    if (expiresAt && new Date(expiresAt) > new Date()) return 'premium'
    return 'member'
  }
  if (weight >= 1) return 'member'
  return 'none'
}

interface PageProps {
  searchParams: Promise<{ categoryId?: string }>
}

export default async function MinistryResourcesPage({ searchParams }: PageProps) {
  const { categoryId } = await searchParams
  const session = await auth()
  const role = session?.user?.role as UserRole | undefined
  const expiresAt = session?.user?.expiresAt ?? null
  const userAccessLevel = getUserAccessLevel(role, expiresAt)
  const weight = role ? (ROLE_WEIGHT[role] ?? 0) : 0

  // 사역 자료는 커뮤니티 정책에 준하여 OFFICER 이상만 등록/수정/삭제
  const canUpload = weight >= 3
  const deleteMode: 'all' | 'own' | null = weight >= 3 ? 'all' : null

  const allowedLevels =
    userAccessLevel === 'premium'
      ? (['PUBLIC', 'MEMBER', 'PREMIUM'] as const)
      : userAccessLevel === 'member'
        ? (['PUBLIC', 'MEMBER'] as const)
        : (['PUBLIC'] as const)

  const [categories, resources, sharePosts] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, order: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    }),
    prisma.resource.findMany({
      where: {
        ...ministryResourceWhere(categoryId),
        accessLevel: { in: [...allowedLevels] },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.findMany({
      where: {
        isPublished: true,
        type: 'SHARE',
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const serializedResources = resources.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    sourceType: 'RESOURCE' as const,
    sourceLabel: '사역 자료',
  }))

  const serializedSharePosts = sharePosts.map((post) => {
    const attachments = getPostAttachments(post.attachments)
    const href = `/community/${CATEGORY_TYPE_URL[post.category.type]}/${post.category.slug}/posts/${post.id}`
    return {
      id: `share-${post.id}`,
      title: post.title,
      description: toExcerpt(post.content),
      content: post.content,
      thumbnail: getPostThumbnail(attachments),
      driveUrl: href,
      fileUrls: [],
      fileType: null,
      accessLevel: 'PUBLIC' as const,
      section: 'MINISTRY',
      uploadedById: post.authorId,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      category: { id: post.category.id, name: post.category.name, slug: post.category.slug },
      sourceType: 'SHARE_POST' as const,
      sourceLabel: '사역 나눔',
      sourceHref: href,
      sourceActionLabel: '게시글 보기',
      sourceExternal: false,
    }
  })

  const serialized = [...serializedResources, ...serializedSharePosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Ministry Resources
          </p>
          <h1 className="text-2xl font-bold">사역 자료</h1>
          <p className="mt-2 text-blue-200 text-sm">
            지역별·언어권별·사역대상별로 분류된 이주민 사역 자료를 공유합니다.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 접근 등급 안내 */}
        {userAccessLevel === 'none' && (
          <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <span className="text-xs font-medium text-blue-700">
              공개 자료는 로그인 없이 열람 가능합니다.{' '}
              <Link href="/auth/login" className="underline">
                로그인하면 더 많은 자료를 볼 수 있습니다 →
              </Link>
            </span>
          </div>
        )}
        {userAccessLevel === 'member' && (
          <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-700">
              정회원 자료도 열람하려면{' '}
              <Link href="/member/upgrade" className="underline">
                정회원 신청 →
              </Link>
            </span>
          </div>
        )}

        {/* 카테고리 필터 탭 */}
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/resources/ministry"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !categoryId
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              전체
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/resources/ministry?categoryId=${cat.id}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  categoryId === cat.id
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* 자료 목록 + 등록 폼 (클라이언트 컴포넌트) */}
        <ResourcesPageClient
          resources={serialized}
          section="MINISTRY"
          userAccessLevel={userAccessLevel}
          canUpload={canUpload}
          deleteMode={deleteMode}
          currentUserId={session?.user?.id}
          isAdmin={weight >= 4}
          categories={categories}
          preselectedCategoryId={categoryId}
        />

        {/* 구글 드라이브 안내 */}
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">구글 드라이브 자료 이용 안내</p>
          <p className="text-blue-600">
            자료는 구글 드라이브로 연결됩니다. 정회원 전용 자료의 경우 드라이브 접근 권한이 별도로
            필요할 수 있습니다. 문의: kima20191227@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}
