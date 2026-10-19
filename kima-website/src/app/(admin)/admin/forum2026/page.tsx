import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ForumRegistrationStatusForm } from '@/components/admin/ForumRegistrationStatusForm'
import { FORUM_DAYS, FORUM_INFO, FORUM_KEY, getForumDayLabel } from '@/lib/forum2026'
import { FORUM_PAYMENT_STATUSES } from '@/schemas/forum2026.schema'
import type { Metadata } from 'next'
import type { ForumPaymentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '2026 포럼 신청 | KIMA 관리자' }

const STATUS_LABELS: Record<ForumPaymentStatus, string> = {
  PENDING: '입금대기',
  CONFIRMED: '입금확인',
  CANCELLED: '취소',
}
const STATUS_COLORS: Record<ForumPaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminForum2026Page({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'ADMIN' && role !== 'OFFICER') redirect('/')

  const sp = await searchParams
  const statusFilter = FORUM_PAYMENT_STATUSES.find((s) => s === sp.status)

  const all = await prisma.forumRegistration.findMany({
    where: { forumKey: FORUM_KEY },
    orderBy: { createdAt: 'desc' },
  })

  // 집계 — 숙박·식사·일자별 인원은 취소 건 제외
  const active = all.filter((r) => r.paymentStatus !== 'CANCELLED')
  const counts = {
    total: all.length,
    PENDING: all.filter((r) => r.paymentStatus === 'PENDING').length,
    CONFIRMED: all.filter((r) => r.paymentStatus === 'CONFIRMED').length,
    CANCELLED: all.filter((r) => r.paymentStatus === 'CANCELLED').length,
    lodging: active.filter((r) => r.needsLodging).length,
    meals: active.filter((r) => r.needsMeals).length,
  }
  const dayCounts = FORUM_DAYS.map((d) => ({
    ...d,
    count: active.filter((r) => r.attendDays.includes(d.value)).length,
  }))

  const rows = statusFilter ? all.filter((r) => r.paymentStatus === statusFilter) : all
  const exportUrl = `/api/admin/forum2026/export${statusFilter ? `?status=${statusFilter}` : ''}`

  const summary = [
    { label: '전체 신청', value: counts.total },
    { label: '입금확인', value: counts.CONFIRMED },
    { label: '입금대기', value: counts.PENDING },
    { label: '숙박', value: counts.lodging },
    { label: '식사', value: counts.meals },
  ]

  const tabs: { key?: ForumPaymentStatus; label: string; count: number }[] = [
    { label: '전체', count: counts.total },
    ...FORUM_PAYMENT_STATUSES.map((s) => ({ key: s, label: STATUS_LABELS[s], count: counts[s] })),
  ]

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">{FORUM_INFO.title} 신청 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            {FORUM_INFO.dateText} · {FORUM_INFO.venueName} — 공개 신청 페이지: <Link href="/forum2026" className="text-[#1B3A6B] underline">/forum2026</Link>
          </p>
        </div>
        <a
          href={exportUrl}
          className="px-4 py-2 rounded-lg bg-[#C8922A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          CSV 다운로드
        </a>
      </div>

      {/* 집계 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
        {summary.map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-2xl font-bold text-[#1B3A6B] mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-2">
        {dayCounts.map((d) => (
          <div key={d.value} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">{d.label} 참석</p>
            <p className="text-2xl font-bold text-[#1B3A6B] mt-1">{d.count}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-6">숙박·식사·일자별 인원은 취소 건을 제외한 수치입니다.</p>

      {/* 상태 필터 */}
      <div className="flex gap-2 flex-wrap mb-4">
        {tabs.map((tab) => {
          const active = tab.key === statusFilter
          return (
            <Link
              key={tab.label}
              href={tab.key ? `/admin/forum2026?status=${tab.key}` : '/admin/forum2026'}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active ? 'bg-[#1B3A6B] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          신청 내역이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">신청자</th>
                <th className="px-4 py-3 text-left font-medium">소속·직분</th>
                <th className="px-4 py-3 text-left font-medium">참석</th>
                <th className="px-4 py-3 text-left font-medium">입금</th>
                <th className="px-4 py-3 text-left font-medium">상태·메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.phone}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {r.createdAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-800">{r.organization}</p>
                    <p className="text-xs text-gray-500">{[r.position, r.region].filter(Boolean).join(' · ')}</p>
                    {r.ministryLanguages.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{r.ministryLanguages.join(', ')}</p>
                    )}
                    {r.requests && (
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-1.5 max-w-xs whitespace-pre-wrap">{r.requests}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                    <p>{r.attendDays.map(getForumDayLabel).join(', ')}</p>
                    <p className="text-gray-500 mt-0.5">
                      숙박 {r.needsLodging ? 'O' : 'X'} · 식사 {r.needsMeals ? 'O' : 'X'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                    <p>입금자: <span className="font-semibold">{r.depositorName}</span></p>
                    {r.depositDate && (
                      <p className="text-gray-500 mt-0.5">
                        예정일: {r.depositDate.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block mb-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.paymentStatus]}`}>
                      {STATUS_LABELS[r.paymentStatus]}
                    </span>
                    <ForumRegistrationStatusForm
                      registrationId={r.id}
                      currentStatus={r.paymentStatus}
                      currentMemo={r.adminMemo}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
