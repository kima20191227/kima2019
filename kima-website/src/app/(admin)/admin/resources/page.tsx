import { prisma } from '@/lib/prisma'
import { ResourceAdminForm } from '@/components/admin/ResourceAdminForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { AccessLevel, ResourceSection } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '자료 관리 | KIMA 관리자' }

const ACCESS_LABELS: Record<AccessLevel, string> = {
  PUBLIC: '공개',
  MEMBER: '회원',
  PREMIUM: '정회원',
}
const ACCESS_COLORS: Record<AccessLevel, string> = {
  PUBLIC: 'bg-gray-100 text-gray-600',
  MEMBER: 'bg-blue-100 text-blue-700',
  PREMIUM: 'bg-amber-100 text-amber-700',
}
const SECTION_LABELS: Record<ResourceSection, string> = {
  KIMA: 'KIMA 자료',
  MINISTRY: '사역 자료',
  PUBLIC: '공개 자료',
}
const SECTION_COLORS: Record<ResourceSection, string> = {
  KIMA: 'bg-purple-100 text-purple-700',
  MINISTRY: 'bg-teal-100 text-teal-700',
  PUBLIC: 'bg-green-100 text-green-700',
}

const VALID_SECTIONS = new Set<ResourceSection>(['KIMA', 'MINISTRY', 'PUBLIC'])

interface PageProps {
  searchParams: Promise<{ category?: string; section?: string }>
}

export default async function AdminResourcesPage({ searchParams }: PageProps) {
  const { category: preselectedSlug, section: rawSection } = await searchParams

  const activeSection: ResourceSection | undefined =
    rawSection && VALID_SECTIONS.has(rawSection as ResourceSection)
      ? (rawSection as ResourceSection)
      : undefined

  const [resources, categories] = await Promise.all([
    prisma.resource.findMany({
      where: activeSection ? { section: activeSection } : undefined,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      select: { id: true, type: true, name: true, slug: true, order: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    }),
  ])

  const catForForm = categories.map((c) => ({ id: c.id, name: c.name, type: c.type, slug: c.slug }))
  const preselectedCatId = preselectedSlug
    ? (categories.find((c) => c.slug === preselectedSlug)?.id ?? '')
    : ''

  const SECTION_TABS = [
    { label: '전체', value: '' },
    { label: 'KIMA 자료', value: 'KIMA' },
    { label: '사역 자료', value: 'MINISTRY' },
    { label: '공개 자료', value: 'PUBLIC' },
  ] as const

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B3A6B]">자료 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          구글 드라이브 자료 링크를 섹션별로 등록·관리합니다.
        </p>
      </div>

      <ResourceAdminForm categories={catForForm} preselectedCategoryId={preselectedCatId} />

      {/* 섹션 탭 */}
      <div className="flex gap-2 mb-4 mt-6 flex-wrap">
        {SECTION_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/resources?section=${tab.value}` : '/admin/resources'}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              (activeSection ?? '') === tab.value
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.value === '' && (
              <span className="ml-1.5 text-xs opacity-70">({resources.length})</span>
            )}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {resources.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">해당 섹션에 등록된 자료가 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                <th className="px-4 py-3 text-left">제목</th>
                <th className="px-4 py-3 text-left">섹션</th>
                <th className="px-4 py-3 text-left">형식</th>
                <th className="px-4 py-3 text-left">등급</th>
                <th className="px-4 py-3 text-left">카테고리</th>
                <th className="px-4 py-3 text-left">등록일</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {resources.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <a
                      href={r.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-[#1B3A6B] hover:underline"
                    >
                      {r.title}
                    </a>
                    {r.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{r.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SECTION_COLORS[r.section]}`}>
                      {SECTION_LABELS[r.section]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      {r.fileType ?? 'ETC'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACCESS_COLORS[r.accessLevel]}`}>
                      {ACCESS_LABELS[r.accessLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.category?.name ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.createdAt.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton url={`/api/admin/resources/${r.id}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
