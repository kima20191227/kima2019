import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ResourceList } from '@/components/resources/ResourceList'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '자료실 | KIMA' }

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

function getUserAccessLevel(role?: UserRole, expiresAt?: string | null): 'none' | 'member' | 'premium' {
  const weight = role ? (ROLE_WEIGHT[role] ?? 0) : 0
  // PREMIUM은 만료일도 함께 확인 — OFFICER·ADMIN은 만료 없음
  if (weight >= 3) return 'premium'  // OFFICER, ADMIN
  if (weight >= 2) {
    // PREMIUM: expiresAt이 현재 시각 이후여야만 유효
    if (expiresAt && new Date(expiresAt) > new Date()) return 'premium'
    return 'member'  // 만료된 정회원 → 일반회원 수준으로 강등
  }
  if (weight >= 1) return 'member'
  return 'none'
}

interface PageProps {
  searchParams: Promise<{ categoryId?: string }>
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const { categoryId } = await searchParams
  const session = await auth()
  const role = session?.user?.role as UserRole | undefined
  const expiresAt = session?.user?.expiresAt
  const userAccessLevel = getUserAccessLevel(role, expiresAt)

  const allowedLevels =
    userAccessLevel === 'premium'
      ? (['PUBLIC', 'MEMBER', 'PREMIUM'] as const)
      : userAccessLevel === 'member'
        ? (['PUBLIC', 'MEMBER'] as const)
        : (['PUBLIC'] as const)

  const [categories, resources] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, type: true, name: true, slug: true, order: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    }),
    prisma.resource.findMany({
      where: {
        accessLevel: { in: [...allowedLevels] },
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const serialized = resources.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1B3A6B]">자료실</h1>
          <p className="mt-2 text-sm text-gray-500">
            비자·법률, 의료·복지, 보조금·공모, 선교·훈련 자료를 열람하세요.
          </p>
          {userAccessLevel === 'none' && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-700">
                공개 자료는 로그인 없이 열람 가능합니다.{' '}
                <a href="/auth/login" className="underline">로그인하면 더 많은 자료를 볼 수 있습니다 →</a>
              </span>
            </div>
          )}
          {userAccessLevel === 'member' && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-700">
                정회원 자료도 열람하려면{' '}
                <a href="/member/upgrade" className="underline">정회원 신청 →</a>
              </span>
            </div>
          )}
        </div>

        {/* 카테고리 필터 탭 */}
        <div className="mb-6 flex flex-wrap gap-2">
          <a
            href="/resources"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !categoryId
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            전체
          </a>
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/resources?categoryId=${cat.id}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryId === cat.id
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>

        {/* 자료 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
          <ResourceList resources={serialized} userAccessLevel={userAccessLevel} searchable />
        </div>

        {/* 안내 */}
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
