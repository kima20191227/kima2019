import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const org = await prisma.organization.findUnique({ where: { id, isPublic: true } })
  if (!org) return { title: '단체를 찾을 수 없습니다 | KIMA' }

  const description = org.description
    ? org.description.slice(0, 120)
    : `${org.region} 지역에서 ${org.languages.join(', ')} 언어권 이주민을 섬기는 단체입니다.`

  return {
    title: `${org.name} | KIMA 단체 디렉토리`,
    description,
    openGraph: {
      title: org.name,
      description,
      type: 'website',
    },
  }
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params
  const [org, session] = await Promise.all([
    prisma.organization.findUnique({ where: { id, isPublic: true } }),
    auth(),
  ])

  if (!org) notFound()

  const isLoggedIn = !!session?.user

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link
          href="/directory"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B3A6B] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          단체 목록으로
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* 상단 컬러 바 */}
          <div className="h-2 bg-gradient-to-r from-[#1B3A6B] to-[#C8922A]" />

          <div className="p-8">
            {/* 단체명 + 유형 */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1B3A6B]">{org.name}</h1>
                {org.representative && (
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    <span className="text-gray-400 font-normal">대표</span> {org.representative}
                  </p>
                )}
                {org.nameEn && (
                  <p className="text-sm text-gray-400 mt-0.5">{org.nameEn}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0 items-start">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {org.region}
                </span>
                {org.type && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    {org.type}
                  </span>
                )}
                {isLoggedIn && (
                  <Link
                    href={`/network/mission-map/${id}/edit`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    수정
                  </Link>
                )}
              </div>
            </div>

            {/* 소개 */}
            {org.description && (
              <p className="mt-6 text-sm text-gray-600 leading-relaxed">{org.description}</p>
            )}

            {/* 언어권 + 사역대상 */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">언어권</h3>
                <div className="flex flex-wrap gap-1.5">
                  {org.languages.map((lang) => (
                    <span key={lang} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">사역대상</h3>
                <div className="flex flex-wrap gap-1.5">
                  {org.targets.map((target) => (
                    <span key={target} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                      {target}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 주소 */}
            {org.address && (
              <div className="mt-6 flex items-start gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {org.address}
              </div>
            )}

            {/* 연락처 — 로그인 회원만 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">연락처</h3>

              {isLoggedIn ? (
                <div className="space-y-2">
                  {org.phone && (
                    <a
                      href={`tel:${org.phone}`}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#1B3A6B] transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {org.phone}
                    </a>
                  )}
                  {org.email && (
                    <a
                      href={`mailto:${org.email}`}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#1B3A6B] transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {org.email}
                    </a>
                  )}
                  {org.website && (
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#1B3A6B] hover:underline"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      웹사이트 방문
                    </a>
                  )}
                  {!org.phone && !org.email && !org.website && (
                    <p className="text-sm text-gray-400">등록된 연락처가 없습니다.</p>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    연락처 확인은 회원 로그인 후 이용하실 수 있습니다.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors"
                  >
                    로그인하기
                  </Link>
                </div>
              )}
            </div>

            {/* 협력 요청 */}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                협력 문의는 KIMA 사무국을 통해 해당 단체로 연결해 드립니다.
              </p>
              <a
                href="mailto:info@kima2019.org"
                className="inline-block mt-2 text-sm text-[#1B3A6B] font-medium hover:underline"
              >
                사무국 문의하기
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
