import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ResourcesPageClient } from '@/components/resources/ResourcesPageClient'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '공개 자료 | KIMA 자료실',
  description: '누구나 자유롭게 열람·다운로드할 수 있는 KIMA 공개 자료입니다.',
}

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

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

export default async function PublicResourcesPage() {
  const session = await auth()
  const role = session?.user?.role as UserRole | undefined
  const expiresAt = session?.user?.expiresAt ?? null
  const userAccessLevel = getUserAccessLevel(role, expiresAt)
  const weight = role ? (ROLE_WEIGHT[role] ?? 0) : 0
  const isAdmin = role === 'ADMIN'

  // 공개 자료: MEMBER 이상이면 등록 가능
  const canUpload = weight >= 1
  // ADMIN은 모든 자료 수정/삭제, 일반 회원은 본인 자료만
  const deleteMode: 'all' | 'own' | null = isAdmin ? 'all' : weight >= 1 ? 'own' : null

  // 공개 자료 섹션은 accessLevel=PUBLIC 자료만 표시
  // (섹션이 PUBLIC인 자료 중 사용자가 접근 가능한 등급까지 표시)
  const allowedLevels =
    userAccessLevel === 'premium'
      ? (['PUBLIC', 'MEMBER', 'PREMIUM'] as const)
      : userAccessLevel === 'member'
        ? (['PUBLIC', 'MEMBER'] as const)
        : (['PUBLIC'] as const)

  const resources = await prisma.resource.findMany({
    where: {
      section: 'PUBLIC',
      accessLevel: { in: [...allowedLevels] },
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = resources.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Open Access
          </p>
          <h1 className="text-2xl font-bold">공개 자료</h1>
          <p className="mt-2 text-blue-200 text-sm">
            누구나 자유롭게 열람하고 다운로드할 수 있는 KIMA 공개 자료입니다.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* 공개 자료 안내 */}
        <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-xs font-medium text-green-700">
            공개(PUBLIC) 자료는 로그인 없이 열람 가능합니다.{' '}
            {!session?.user && (
              <Link href="/auth/login" className="underline">
                로그인하면 자료를 직접 등록할 수 있습니다 →
              </Link>
            )}
          </span>
        </div>

        {/* 자료 목록 + 등록 폼 (클라이언트 컴포넌트) */}
        <ResourcesPageClient
          resources={serialized}
          section="PUBLIC"
          userAccessLevel={userAccessLevel}
          canUpload={canUpload}
          deleteMode={deleteMode}
          currentUserId={session?.user?.id}
        />

        {/* 구글 드라이브 안내 */}
        <div className="mt-6 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">구글 드라이브 자료 이용 안내</p>
          <p className="text-blue-600">
            자료는 구글 드라이브로 연결됩니다. 문의: kima20191227@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}
