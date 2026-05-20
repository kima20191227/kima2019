import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MemberRoleForm } from '@/components/admin/MemberRoleForm'
import { MemberSearchInput } from '@/components/admin/MemberSearchInput'
import { DeleteMemberButton } from '@/components/admin/DeleteMemberButton'
import { MemberEditButton } from '@/components/admin/MemberEditButton'
import { MemberCreateButton } from '@/components/admin/MemberCreateButton'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { UserRole, Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '회원 관리 | KIMA 관리자' }

const ROLE_LABELS: Record<UserRole, string> = {
  MEMBER:  '일반회원',
  PREMIUM: '정회원',
  OFFICER: '임원',
  ADMIN:   '관리자',
}
const ROLE_COLORS: Record<UserRole, string> = {
  MEMBER:  'bg-gray-100 text-gray-600',
  PREMIUM: 'bg-amber-100 text-amber-700',
  OFFICER: 'bg-purple-100 text-purple-700',
  ADMIN:   'bg-red-100 text-red-700',
}

type SortField = 'name' | 'createdAt' | 'expiresAt' | 'role'
type SortOrder = 'asc' | 'desc'

interface PageProps {
  searchParams: Promise<{
    tab?: string
    sort?: string
    order?: string
    role?: string
    q?: string
  }>
}

// 컬럼 헤더 — sort/order URL 파라미터 토글 링크
function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  params,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentOrder: SortOrder
  params: URLSearchParams
}) {
  const isActive = currentSort === field
  const nextOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc'
  const sp = new URLSearchParams(params.toString())
  sp.set('sort', field)
  sp.set('order', nextOrder)

  return (
    <Link href={`/admin/members?${sp.toString()}`} className="flex items-center gap-1 group">
      {label}
      <span className={`text-[10px] ${isActive ? 'text-[#1B3A6B]' : 'text-gray-300 group-hover:text-gray-400'}`}>
        {isActive ? (currentOrder === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </Link>
  )
}

export default async function AdminMembersPage({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'ADMIN' && role !== 'OFFICER') redirect('/')

  const sp = await searchParams
  const isPendingTab = sp.tab === 'pending'

  const sort   = (['name','createdAt','expiresAt','role'].includes(sp.sort ?? '') ? sp.sort : 'createdAt') as SortField
  const order  = (sp.order === 'asc' ? 'asc' : 'desc') as SortOrder
  const roleFilter = (['MEMBER','PREMIUM','OFFICER','ADMIN'].includes(sp.role ?? '') ? sp.role : undefined) as UserRole | undefined
  const q = sp.q?.trim() ?? ''

  // URLSearchParams 객체 (SortHeader에 전달)
  const urlParams = new URLSearchParams()
  if (sp.tab)   urlParams.set('tab', sp.tab)
  if (sp.sort)  urlParams.set('sort', sp.sort)
  if (sp.order) urlParams.set('order', sp.order)
  if (sp.role)  urlParams.set('role', sp.role)
  if (sp.q)     urlParams.set('q', sp.q)

  // 검색 조건
  const where: Prisma.UserWhereInput = {
    ...(isPendingTab ? { role: 'MEMBER', premiumNote: { startsWith: '[신청]' } } : {}),
    ...(roleFilter && !isPendingTab ? { role: roleFilter } : {}),
    ...(q ? {
      OR: [
        { name:         { contains: q, mode: 'insensitive' } },
        { email:        { contains: q, mode: 'insensitive' } },
        { organization: { contains: q, mode: 'insensitive' } },
      ],
    } : {}),
  }

  // 정렬
  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === 'role'      ? { role: order } :
    sort === 'name'      ? { name: order } :
    sort === 'expiresAt' ? { expiresAt: { sort: order, nulls: order === 'asc' ? 'last' : 'first' } } :
                           { createdAt: order }

  const [users, pendingCount, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      select: {
        id: true, name: true, email: true, role: true,
        organization: true, position: true, phone: true,
        address: true, denomination: true, region: true,
        premiumNote: true, approvedAt: true, expiresAt: true, createdAt: true,
      },
    }),
    prisma.user.count({ where: { role: 'MEMBER', premiumNote: { startsWith: '[신청]' } } }),
    prisma.user.count({ where: roleFilter && !isPendingTab ? { role: roleFilter } : undefined }),
  ])

  // 역할 필터 링크 생성 헬퍼
  function roleFilterUrl(r?: UserRole) {
    const s = new URLSearchParams(urlParams.toString())
    if (r) s.set('role', r); else s.delete('role')
    s.delete('tab')
    return `/admin/members?${s.toString()}`
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">회원 관리</h1>
          <p className="text-sm text-gray-500 mt-1">회원 등급 변경 및 납부 메모를 관리합니다.</p>
        </div>
        <MemberCreateButton />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        <a
          href="/admin/members"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            !isPendingTab ? 'border-[#1B3A6B] text-[#1B3A6B]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          전체 회원
        </a>
        <a
          href="/admin/members?tab=pending"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-1.5 ${
            isPendingTab ? 'border-[#1B3A6B] text-[#1B3A6B]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          정회원 신청 대기
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
              {pendingCount}
            </span>
          )}
        </a>
      </div>

      {/* 검색 + 역할 필터 */}
      {!isPendingTab && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {([undefined, 'MEMBER', 'PREMIUM', 'OFFICER', 'ADMIN'] as (UserRole | undefined)[]).map((r) => (
              <Link
                key={r ?? 'all'}
                href={roleFilterUrl(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {r ? ROLE_LABELS[r] : '전체'}
              </Link>
            ))}
          </div>
          <MemberSearchInput defaultValue={q} />
        </div>
      )}

      {/* 건수 */}
      <p className="text-xs text-gray-400 mb-3">
        총 <span className="font-semibold text-gray-600">{users.length}</span>명
        {!isPendingTab && roleFilter && ` (전체 ${totalCount}명 중 필터)`}
        {q && ` — "${q}" 검색 결과`}
      </p>

      {/* 테이블 */}
      <p className="sm:hidden text-xs text-gray-400 mb-1.5 text-right">← 좌우로 스크롤하세요</p>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        {users.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">
            {isPendingTab ? '정회원 신청 대기 회원이 없습니다.' : '조건에 맞는 회원이 없습니다.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                <th scope="col" aria-label="이름 / 이메일" className="px-4 py-3 text-left">
                  <SortHeader label="이름 / 이메일" field="name" currentSort={sort} currentOrder={order} params={urlParams} />
                </th>
                <th scope="col" className="px-4 py-3 text-left">소속</th>
                <th scope="col" aria-label="가입일" className="px-4 py-3 text-left">
                  <SortHeader label="가입일" field="createdAt" currentSort={sort} currentOrder={order} params={urlParams} />
                </th>
                <th scope="col" aria-label="만료일" className="px-4 py-3 text-left">
                  <SortHeader label="만료일" field="expiresAt" currentSort={sort} currentOrder={order} params={urlParams} />
                </th>
                <th scope="col" aria-label="등급 / 메모" className="px-4 py-3 text-left">
                  <SortHeader label="등급 / 메모" field="role" currentSort={sort} currentOrder={order} params={urlParams} />
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs text-gray-400 font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => {
                const isExpired = user.expiresAt ? user.expiresAt < new Date() : false
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(user.name ?? user.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name ?? '(없음)'}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{user.organization ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {user.createdAt.toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {user.expiresAt ? (
                        <span className={isExpired ? 'text-red-500 font-medium' : 'text-gray-400'}>
                          {user.expiresAt.toLocaleDateString('ko-KR')}
                          {isExpired && ' (만료)'}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <span className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                        {user.premiumNote?.startsWith('[신청]') && (
                          <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1.5 leading-relaxed">
                            {user.premiumNote.replace('[신청] ', '')}
                          </p>
                        )}
                        <MemberRoleForm
                          userId={user.id}
                          currentRole={user.role}
                          currentNote={user.premiumNote}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <MemberEditButton user={user} />
                        <DeleteMemberButton userId={user.id} userName={user.name ?? user.email} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
