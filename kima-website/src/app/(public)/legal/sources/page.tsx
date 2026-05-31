import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  ACCESS_LEVEL_META,
  LEGAL_CATEGORY_META,
  LEGAL_SOURCE_TYPE_META,
  formatLegalDate,
  getAllowedLegalAccessLevels,
} from '@/lib/legalCategories'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '법령 공식 출처 | KIMA',
  description: '회원들이 직접 확인할 수 있는 이주민·다문화 관련 공식 법령 출처입니다.',
  robots: { index: false, follow: false },
}

function statusLabel(status?: string | null) {
  switch (status) {
    case 'updated':
      return '법령 정보 갱신됨'
    case 'changed':
      return '출처 변경 감지'
    case 'ok':
      return '정상 확인'
    case 'not_found':
      return '검색 결과 없음'
    case 'error':
      return '확인 오류'
    default:
      return '확인 전'
  }
}

function statusClassName(status?: string | null) {
  if (status === 'updated' || status === 'changed') return 'bg-amber-50 text-amber-700 border-amber-100'
  if (status === 'ok') return 'bg-green-50 text-green-700 border-green-100'
  if (status === 'error' || status === 'not_found') return 'bg-red-50 text-red-700 border-red-100'
  return 'bg-gray-50 text-gray-600 border-gray-100'
}

export default async function LegalSourcesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/login?callbackUrl=/legal/sources')
  }

  const accessLevels = getAllowedLegalAccessLevels(session.user.role)
  const sources = await prisma.legalSource.findMany({
    where: {
      isEnabled: true,
      accessLevel: { in: accessLevels },
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  }).catch(() => [])

  const lastCheckedAt = sources
    .map((source) => source.lastCheckedAt)
    .filter((value): value is Date => !!value)
    .sort((a, b) => b.getTime() - a.getTime())[0]
  const changedCount = sources.filter((source) => source.lastStatus === 'updated' || source.lastStatus === 'changed').length

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Official Sources
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">법령 공식 출처</h1>
          <p className="mt-3 text-blue-100 text-sm leading-relaxed max-w-2xl">
            법령 원문을 복사해 쌓기보다, 회원들이 신뢰할 수 있는 공식 출처를 직접 확인하도록
            연결합니다. 자동 확인 결과는 이 화면에 함께 표시됩니다.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <div className="rounded-lg bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400">등록 출처</p>
              <p className="mt-1 text-lg font-bold text-[#1B3A6B]">{sources.length.toLocaleString()}개</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400">변경 감지</p>
              <p className="mt-1 text-lg font-bold text-[#1B3A6B]">{changedCount.toLocaleString()}개</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400">마지막 자동 확인</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">{formatLegalDate(lastCheckedAt) ?? '확인 전'}</p>
            </div>
          </div>
          <Link
            href="/legal"
            className="text-sm font-semibold text-[#1B3A6B] hover:underline"
          >
            법령 목록으로
          </Link>
        </div>

        {sources.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-lg font-semibold text-gray-800">등록된 공식 출처가 없습니다</p>
            <p className="mt-2 text-sm text-gray-500">
              관리자에게 출처 등록 또는 초기 데이터 삽입을 요청해주세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {sources.map((source) => {
              const category = LEGAL_CATEGORY_META[source.category]
              const sourceType = LEGAL_SOURCE_TYPE_META[source.sourceType]
              const access = ACCESS_LEVEL_META[source.accessLevel]
              return (
                <article key={source.id} className="rounded-xl bg-white border border-gray-100 shadow-sm p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-semibold', category.className)}>
                      {category.label}
                    </span>
                    <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-medium', sourceType.className)}>
                      {sourceType.label}
                    </span>
                    <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-medium', access.className)}>
                      {access.label}
                    </span>
                  </div>

                  <h2 className="mt-3 text-base font-bold text-gray-900">{source.name}</h2>
                  {source.description && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {source.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>상태 {statusLabel(source.lastStatus)}</span>
                    <span>확인 {formatLegalDate(source.lastCheckedAt) ?? '-'}</span>
                    <span>변경 {formatLegalDate(source.lastChangedAt) ?? '-'}</span>
                  </div>

                  {source.lastError && (
                    <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {source.lastError}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className={cn('px-2.5 py-1 rounded-full border text-xs font-medium', statusClassName(source.lastStatus))}>
                      {statusLabel(source.lastStatus)}
                    </span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#1B3A6B] hover:underline"
                    >
                      공식 출처 열기
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
