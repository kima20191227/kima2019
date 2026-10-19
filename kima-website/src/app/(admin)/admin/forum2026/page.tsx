import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ForumRegistrationStatusForm } from '@/components/admin/ForumRegistrationStatusForm'
import { FORUM_DAYS, FORUM_INFO, FORUM_LODGING_NIGHTS, getForumDayLabel } from '@/lib/forum2026'
import {
  buildForumAdminWhere,
  filterForumRowsByStay,
  findDuplicatePhones,
  formatForumLodgingLabels,
  formatForumMealLabels,
  formatForumStayShort,
  forumAdminQueryString,
  forumDayCounts,
  FORUM_EXPORT_COLUMNS,
  FORUM_STATUS_LABELS,
  hasForumAdminSearch,
  normalizePhone,
  parseForumAdminFilters,
} from '@/lib/forum2026Admin'
import { FORUM_EXPORT_COLUMN_KEYS, FORUM_PAYMENT_STATUSES } from '@/schemas/forum2026.schema'
import type { Metadata } from 'next'
import type { ForumPaymentStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '2026 포럼 신청 | KIMA 관리자' }

// 색만으로 구분하지 않도록 항상 텍스트와 함께 표시
const STATUS_BADGE: Record<ForumPaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 ring-amber-300',
  CONFIRMED: 'bg-green-100 text-green-800 ring-green-300',
  CANCELLED: 'bg-gray-100 text-gray-600 ring-gray-300',
}

const FIELD = 'text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]'

// 목록 열 (md 이상) — 이름 | 참석일 | 숙박·식사 | 입금자명 | 상태 | 신청일
const ROW_GRID = 'md:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_9.5rem_minmax(0,1fr)_5.5rem_5.5rem]'

function formatDateTime(date: Date) {
  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' })
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminForum2026Page({ searchParams }: PageProps) {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'ADMIN' && role !== 'OFFICER') redirect('/')

  const filters = parseForumAdminFilters(await searchParams)
  const isSearching = hasForumAdminSearch(filters)

  // all: 전체 집계·중복 판정용 / matched: 검색 조건 적용(상태 제외) — 탭별 건수용
  const [all, matched] = await Promise.all([
    prisma.forumRegistration.findMany({
      where: buildForumAdminWhere({}),
      orderBy: { createdAt: 'desc' },
    }),
    isSearching
      ? prisma.forumRegistration.findMany({
          where: buildForumAdminWhere(filters, { ignoreStatus: true }),
          orderBy: { createdAt: 'desc' },
        })
      : null,
  ])
  const searched = matched ? filterForumRowsByStay(matched, filters) : all
  const rows = filters.status ? searched.filter((r) => r.paymentStatus === filters.status) : searched

  const countBy = (list: typeof all, s: ForumPaymentStatus) => list.filter((r) => r.paymentStatus === s).length
  const stats = [
    { label: '전체', value: all.length },
    ...FORUM_PAYMENT_STATUSES.map((s) => ({ label: FORUM_STATUS_LABELS[s], value: countBy(all, s) })),
  ]
  const dayCounts = forumDayCounts(all)
  const duplicatePhones = findDuplicatePhones(all)

  const tabs: { key?: ForumPaymentStatus; label: string; count: number }[] = [
    { label: '전체', count: searched.length },
    ...FORUM_PAYMENT_STATUSES.map((s) => ({ key: s, label: FORUM_STATUS_LABELS[s], count: countBy(searched, s) })),
  ]

  const hiddenFilters = (['status', 'q', 'day', 'lodging', 'meal'] as const).filter((k) => filters[k])

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">{FORUM_INFO.title} 신청 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            {FORUM_INFO.dateText} · {FORUM_INFO.venueName} — 공개 신청 페이지: <Link href="/forum2026" className="text-[#1B3A6B] underline">/forum2026</Link>
          </p>
        </div>

        {/* CSV — 현재 필터 유지 + 열 선택 */}
        <details className="relative">
          <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-4 py-2 rounded-lg bg-[#C8922A] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            CSV 다운로드
          </summary>
          <form
            action="/api/admin/forum2026/export"
            method="get"
            className="mt-2 md:absolute md:right-0 md:z-10 w-full md:w-80 bg-white rounded-xl border border-gray-200 shadow-lg p-4 space-y-3"
          >
            {hiddenFilters.map((k) => (
              <input key={k} type="hidden" name={k} value={filters[k]} />
            ))}
            <p className="text-xs text-gray-500">
              포함할 열을 선택하세요. 현재 목록의 검색·필터 조건이 그대로 적용됩니다.
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {FORUM_EXPORT_COLUMN_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-1.5 text-sm text-gray-700">
                  <input type="checkbox" name="cols" value={key} defaultChecked className="accent-[#1B3A6B]" />
                  {FORUM_EXPORT_COLUMNS[key].label}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-400">아무 열도 선택하지 않으면 전체 열을 내보냅니다.</p>
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-[#C8922A] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              다운로드 ({rows.length}건)
            </button>
          </form>
        </details>
      </div>

      {/* 집계 — 컴팩트 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4 flex flex-col lg:flex-row gap-3 lg:items-start">
        <div className="flex flex-wrap gap-2">
          {stats.map((s) => (
            <span key={s.label} className="inline-flex items-baseline gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs text-gray-600">
              {s.label}
              <strong className="text-base text-[#1B3A6B]">{s.value}</strong>
            </span>
          ))}
        </div>
        <div className="lg:ml-auto overflow-x-auto">
          <table className="text-xs">
            <caption className="text-left text-[11px] text-gray-400 pb-1">취소 제외 · 숙박은 그날 밤 기준</caption>
            <thead className="text-gray-500">
              <tr>
                <th className="pr-4 py-0.5 text-left font-medium">일자</th>
                <th className="px-2 py-0.5 text-right font-medium">참석</th>
                <th className="px-2 py-0.5 text-right font-medium">숙박</th>
                <th className="pl-2 py-0.5 text-right font-medium">식사</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {dayCounts.map((d) => (
                <tr key={d.value} className="border-t border-gray-100">
                  <td className="pr-4 py-0.5 whitespace-nowrap">{d.label}</td>
                  <td className="px-2 py-0.5 text-right font-semibold text-[#1B3A6B]">{d.attend}</td>
                  <td className="px-2 py-0.5 text-right">{d.lodging ?? '-'}</td>
                  <td className="pl-2 py-0.5 text-right">{d.meals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 검색·필터 (GET) */}
      <form method="get" action="/admin/forum2026" className="flex flex-wrap gap-2 items-center mb-3">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <input
          type="search"
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder="이름·휴대폰·입금자명·소속·이메일"
          aria-label="검색어"
          maxLength={100}
          className={`${FIELD} flex-1 min-w-[12rem]`}
        />
        <select name="day" defaultValue={filters.day ?? ''} aria-label="참석일" className={FIELD}>
          <option value="">참석일 전체</option>
          {FORUM_DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <select name="lodging" defaultValue={filters.lodging ?? ''} aria-label="숙박" className={FIELD}>
          <option value="">숙박 전체</option>
          <option value="Y">숙박 있음</option>
          <option value="N">숙박 없음</option>
          {FORUM_LODGING_NIGHTS.map((n) => (
            <option key={n.value} value={n.value}>{n.label} 숙박</option>
          ))}
        </select>
        <select name="meal" defaultValue={filters.meal ?? ''} aria-label="식사" className={FIELD}>
          <option value="">식사 전체</option>
          <option value="Y">식사 있음</option>
          <option value="N">식사 없음</option>
          {FORUM_DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label} 식사</option>
          ))}
        </select>
        <button type="submit" className="text-sm px-4 py-1.5 rounded-lg bg-[#1B3A6B] text-white hover:bg-[#142d54] transition-colors">
          검색
        </button>
        {isSearching && (
          <Link
            href={`/admin/forum2026${forumAdminQueryString({ status: filters.status })}`}
            className="text-sm text-gray-500 underline"
          >
            초기화
          </Link>
        )}
      </form>

      {/* 상태 탭 — 검색 조건 유지 */}
      <div className="flex gap-2 flex-wrap items-center mb-3">
        {tabs.map((tab) => {
          const isActive = tab.key === filters.status
          return (
            <Link
              key={tab.label}
              href={`/admin/forum2026${forumAdminQueryString(filters, { status: tab.key })}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive ? 'bg-[#1B3A6B] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          )
        })}
        <span className="ml-auto text-xs text-gray-500">
          {isSearching || filters.status ? '검색 결과' : '전체'} <strong className="text-gray-800">{rows.length}</strong>건
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
          {isSearching ? '조건에 맞는 신청 내역이 없습니다.' : '신청 내역이 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className={`hidden md:grid ${ROW_GRID} gap-x-3 px-4 py-2 bg-gray-50 rounded-t-xl text-xs font-medium text-gray-500`}>
            <span>이름 · 소속</span>
            <span>참석일</span>
            <span>숙박 · 식사</span>
            <span>입금자명</span>
            <span>상태</span>
            <span>신청일</span>
          </div>
          <ul className="divide-y divide-gray-100">
            {rows.map((r) => {
              const isCancelled = r.paymentStatus === 'CANCELLED'
              const isDuplicate = duplicatePhones.has(normalizePhone(r.phone))
              return (
                <li key={r.id}>
                  <details className="group">
                    <summary
                      className={`list-none [&::-webkit-details-marker]:hidden cursor-pointer grid grid-cols-2 ${ROW_GRID} gap-x-3 gap-y-1 px-4 py-3 md:items-center hover:bg-gray-50 group-open:bg-blue-50/40`}
                    >
                      <div className="col-span-2 md:col-span-1 min-w-0">
                        <p className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-gray-400 text-xs transition-transform group-open:rotate-90" aria-hidden="true">▶</span>
                          <span className={`font-semibold text-gray-900 ${isCancelled ? 'line-through text-gray-500' : ''}`}>{r.name}</span>
                          {isDuplicate && (
                            <span
                              className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 ring-1 ring-rose-300 text-[11px] font-medium"
                              title="같은 휴대폰 번호로 신청된 건이 더 있습니다"
                            >
                              중복 의심
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{r.organization}</p>
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="md:hidden text-gray-400">참석 </span>
                        {r.attendDays.map(getForumDayLabel).join(', ')}
                      </div>
                      <div className="text-xs text-gray-700">
                        {formatForumStayShort(r)}
                      </div>
                      <div className="text-xs text-gray-700 min-w-0 truncate">
                        <span className="md:hidden text-gray-400">입금자 </span>
                        <span className="font-semibold">{r.depositorName}</span>
                      </div>
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${STATUS_BADGE[r.paymentStatus]}`}>
                          {FORUM_STATUS_LABELS[r.paymentStatus]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 col-span-2 md:col-span-1">
                        <span className="md:hidden text-gray-400">신청 </span>
                        {r.createdAt.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' })}
                      </div>
                    </summary>

                    <div className="px-4 pb-4 pt-1 bg-blue-50/40 space-y-3">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        {[
                          { label: '휴대폰', value: r.phone },
                          { label: '이메일', value: r.email },
                          { label: '직분', value: r.position },
                          { label: '지역', value: r.region },
                          { label: '언어권', value: r.ministryLanguages.join(', ') },
                          { label: '숙박', value: formatForumLodgingLabels(r) || '없음' },
                          { label: '식사', value: formatForumMealLabels(r) || '없음' },
                          { label: '입금 예정일', value: r.depositDate?.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) },
                          { label: '신청일시', value: formatDateTime(r.createdAt) },
                        ].map((item) => (
                          <div key={item.label} className="flex gap-3 min-w-0">
                            <dt className="w-20 flex-shrink-0 text-xs text-gray-500 pt-0.5">{item.label}</dt>
                            <dd className="text-gray-800 break-all">{item.value || '-'}</dd>
                          </div>
                        ))}
                      </dl>
                      {r.requests && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">요청사항</p>
                          <p className="text-sm text-gray-700 bg-white rounded-lg border border-gray-100 p-2 whitespace-pre-wrap">{r.requests}</p>
                        </div>
                      )}
                      <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-2">
                        <ForumRegistrationStatusForm
                          registrationId={r.id}
                          currentStatus={r.paymentStatus}
                          currentMemo={r.adminMemo}
                        />
                        <p className="text-xs text-gray-500">
                          {r.updatedByName
                            ? `최종 수정: ${formatDateTime(r.updatedAt)} · ${r.updatedByName}`
                            : '최종 수정: 관리자 수정 이력 없음'}
                          {r.statusChangedAt && ` (입금 상태 변경: ${formatDateTime(r.statusChangedAt)})`}
                        </p>
                      </div>
                    </div>
                  </details>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
