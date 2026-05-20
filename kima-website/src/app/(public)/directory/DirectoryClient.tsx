'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Organization } from '@prisma/client'
import { OrganizationCard } from '@/components/directory/OrganizationCard'
import { FilterBar } from '@/components/directory/FilterBar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const MapComponent = dynamic(
  () => import('@/components/directory/MapComponent').then((m) => m.MapComponent),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" /> }
)

function DirectoryContent({ initialOrgs }: { initialOrgs: Organization[] }) {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [orgs, setOrgs]       = useState<Organization[]>(initialOrgs)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [hoveredId, setHoveredId]   = useState<string | undefined>()

  // 필터 변경 시에만 재fetch (초기 로드는 서버 데이터 사용)
  useEffect(() => {
    const region   = searchParams.get('region')
    const language = searchParams.get('language')
    const target   = searchParams.get('target')
    const type     = searchParams.get('type')
    const q        = searchParams.get('q')

    if (!region && !language && !target && !type && !q) {
      setOrgs(initialOrgs)
      return
    }

    const params = new URLSearchParams()
    if (region)   params.set('region', region)
    if (language) params.set('language', language)
    if (target)   params.set('target', target)
    if (type)     params.set('type', type)
    if (q)        params.set('q', q)

    setLoading(true)
    fetch(`/api/organizations?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setOrgs(data.organizations ?? []))
      .finally(() => setLoading(false))
  }, [searchParams, initialOrgs])

  const isLoggedIn = !!session?.user

  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col lg:h-[calc(100vh-80px)] lg:flex-row">

      {/* 왼쪽 2/3: 필터 + 지도 */}
      <div className="flex min-w-0 flex-col border-b border-gray-100 lg:flex-[2] lg:border-r lg:border-b-0">
        <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#1B3A6B]">사역단체 전국지도</h1>
              <p className="text-xs text-gray-400 mt-0.5">전국 다문화 사역 단체를 찾아보세요</p>
            </div>
            <Link
              href="/directory/register"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1B3A6B] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#15305a]"
            >
              + 단체 등록
            </Link>
          </div>
          <FilterBar totalCount={orgs.length} />
        </div>

        <div className="relative h-[42dvh] min-h-[300px] lg:h-auto lg:min-h-0 lg:flex-1">
          <MapComponent
            organizations={orgs}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            showContact={isLoggedIn}
          />
        </div>
      </div>

      {/* 오른쪽 1/3: 목록 패널 */}
      <div className="flex w-full flex-col bg-white shadow-xl lg:w-[320px] lg:shrink-0 xl:w-[380px]">
        <div className="px-5 py-3 bg-[#1B3A6B] shrink-0">
          <p className="text-white font-bold text-sm">등록 단체 현황</p>
          <p className="text-blue-200 text-xs mt-0.5">
            {loading ? '불러오는 중…' : `${orgs.length}개 단체`}
          </p>
        </div>

        <div className="flex flex-col gap-2 p-3 lg:flex-1 lg:overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : orgs.length === 0 ? (
            <EmptyState
              title="등록된 단체가 없습니다"
              description="다른 필터 조건으로 검색해 보세요."
              action={
                <Link href="/directory" className="text-sm text-[#1B3A6B] font-medium hover:underline">
                  필터 초기화
                </Link>
              }
            />
          ) : (
            orgs.map((org) => (
              <OrganizationCard
                key={org.id}
                org={org}
                isSelected={selectedId === org.id}
                isHovered={hoveredId === org.id}
                onSelect={() => setSelectedId(org.id)}
                showContact={isLoggedIn}
              />
            ))
          )}

          {!isLoggedIn && orgs.length > 0 && (
            <p className="text-xs text-center text-gray-400 mt-1 pb-2">
              연락처 확인은{' '}
              <Link href="/auth/login" className="text-[#1B3A6B] underline">로그인</Link>{' '}
              후 이용하실 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function DirectoryClient({ initialOrgs }: { initialOrgs: Organization[] }) {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100dvh-80px)] items-center justify-center"><LoadingSpinner /></div>}>
      <DirectoryContent initialOrgs={initialOrgs} />
    </Suspense>
  )
}
