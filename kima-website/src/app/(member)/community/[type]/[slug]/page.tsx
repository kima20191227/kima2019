import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PostCard } from '@/components/community/PostCard'
import { ResourceListSection } from '@/components/community/ResourceListSection'
import type { Metadata } from 'next'
import type { CategoryType, AccessLevel, PostType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const URL_TO_DB: Record<string, CategoryType> = {
  region: 'REGION',
  language: 'LANGUAGE',
  target: 'TARGET',
}

interface Props {
  params: Promise<{ type: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug }, select: { name: true } })
  if (!category) return { title: '카테고리를 찾을 수 없습니다 | KIMA' }
  return { title: `${category.name} | KIMA 커뮤니티` }
}


export default async function CategoryBoardPage({ params }: Props) {
  const { type, slug } = await params
  const dbType = URL_TO_DB[type]
  if (!dbType) notFound()

  let officerPhone: string | null = null
  let officerEmail: string | null = null

  const session = await auth()

  type CategoryResult = {
    id: string; type: CategoryType; name: string; slug: string; order: number; createdAt: Date
    officerName: string | null; officerSns: string | null; officerQr: string | null
    posts: {
      id: string; title: string; content: string; type: PostType; isPublished: boolean
      categoryId: string; authorId: string; createdAt: Date; updatedAt: Date
      author: { id: string; name: string | null }
      category: { id: string; name: string; slug: string }
    }[]
    resources: {
      id: string; title: string; description: string | null; driveUrl: string
      fileType: string | null; accessLevel: AccessLevel; categoryId: string | null
      uploadedById: string | null; createdAt: Date; updatedAt: Date
    }[]
  } | null

  let category: CategoryResult = null

  try {
    const row = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true, type: true, name: true, slug: true, order: true, createdAt: true,
        officerName: true, officerSns: true, officerQr: true,
        officerPhone: true, officerEmail: true,
        posts: {
          where: { isPublished: true },
          include: {
            author: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' as const },
          take: 30,
        },
        resources: { orderBy: { createdAt: 'desc' as const } },
      },
    })
    if (row) {
      officerPhone = (row as unknown as { officerPhone?: string | null }).officerPhone ?? null
      officerEmail = (row as unknown as { officerEmail?: string | null }).officerEmail ?? null
      category = row as unknown as CategoryResult
    }
  } catch {
    // DB에 officerPhone/officerEmail 컬럼이 없으면 기본 조회
    const row = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true, type: true, name: true, slug: true, order: true, createdAt: true,
        officerName: true, officerSns: true, officerQr: true,
        posts: {
          where: { isPublished: true },
          include: {
            author: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' as const },
          take: 30,
        },
        resources: { orderBy: { createdAt: 'desc' as const } },
      },
    })
    category = row as unknown as CategoryResult
  }

  if (!category || category.type !== dbType) notFound()

  const userRole = session?.user?.role
  const ROLE_WEIGHT = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 } as const
  const roleWeight = userRole ? (ROLE_WEIGHT[userRole] ?? 1) : 0
  const canWrite = roleWeight >= 3
  const isPremium = roleWeight >= 2

  const notices = category.posts.filter((p) => p.type === 'NOTICE')
  const shares = category.posts.filter((p) => p.type === 'SHARE')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 뒤로가기 */}
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B3A6B] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          커뮤니티 목록
        </Link>

        {/* 카테고리 헤더 + 담당 위원장 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B3A6B]">{category.name}</h1>
              <p className="text-sm text-gray-400 mt-1">
                {dbType === 'REGION' && '지역별 카테고리'}
                {dbType === 'LANGUAGE' && '언어권별 카테고리'}
                {dbType === 'TARGET' && '사역대상별 카테고리'}
              </p>
            </div>

            {/* 담당 위원장 */}
            {category.officerName && (
              <div className="flex items-start gap-4 bg-[#F8F9FA] rounded-xl p-4">
                {category.officerQr && (
                  <Image
                    src={category.officerQr}
                    alt="QR코드"
                    width={64}
                    height={64}
                    className="rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-1">담당 위원장</p>
                  <p className="text-sm font-bold text-[#1B3A6B]">{category.officerName}</p>
                  <div className="mt-1.5 space-y-1">
                    {officerPhone && (
                      <a
                        href={`tel:${officerPhone.replace(/-/g, '')}`}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1B3A6B] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {officerPhone}
                      </a>
                    )}
                    {officerEmail && (
                      <a
                        href={`mailto:${officerEmail}`}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-[#1B3A6B] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {officerEmail}
                      </a>
                    )}
                    {category.officerSns && (
                      <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {category.officerSns}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 공지 + 사역나눔 게시판 (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* 공지사항 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#1B3A6B] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#1B3A6B] inline-block" />
                  공지사항
                </h2>
                {canWrite && (
                  <Link
                    href={`/community/${type}/${slug}/write`}
                    className="text-xs text-[#1B3A6B] font-medium hover:underline"
                  >
                    + 글쓰기
                  </Link>
                )}
              </div>
              {notices.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">등록된 공지사항이 없습니다.</p>
              ) : (
                <div>
                  {notices.map((post) => (
                    <PostCard key={post.id} post={post} categoryType={type} />
                  ))}
                </div>
              )}
            </div>

            {/* 사역 나눔 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#1B3A6B] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C8922A] inline-block" />
                  사역 나눔
                </h2>
                {canWrite && (
                  <Link
                    href={`/community/${type}/${slug}/write`}
                    className="text-xs text-[#1B3A6B] font-medium hover:underline"
                  >
                    + 글쓰기
                  </Link>
                )}
              </div>
              {shares.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">등록된 사역 나눔이 없습니다.</p>
              ) : (
                <div>
                  {shares.map((post) => (
                    <PostCard key={post.id} post={post} categoryType={type} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 자료 목록 (1/3) */}
          <div className="lg:col-span-1">
            <ResourceListSection
              resources={category.resources}
              categoryId={category.id}
              categoryName={category.name}
              userId={session?.user?.id ?? null}
              roleWeight={roleWeight}
              isPremium={isPremium}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
