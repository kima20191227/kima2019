'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

export interface NewsListItem {
  id: string
  title: string
  sourceName: string
  categoryLabel: string
  categoryColorClass: string
  relevanceLabel: string
  publishedAtLabel: string
  isVisible: boolean
}

export type NewsStatusFilter = 'all' | 'visible' | 'hidden'
export type NewsSortOption = 'latest' | 'relevance_asc' | 'relevance_desc'

interface NewsListManagerProps {
  items: NewsListItem[]
  page: number
  totalPages: number
  hiddenCount: number
  status: NewsStatusFilter
  sort: NewsSortOption
}

const STATUS_OPTIONS: { value: NewsStatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'visible', label: '공개' },
  { value: 'hidden', label: '숨김' },
]

const SORT_OPTIONS: { value: NewsSortOption; label: string }[] = [
  { value: 'latest', label: '최신순' },
  { value: 'relevance_asc', label: '관련도 낮은순' },
  { value: 'relevance_desc', label: '관련도 높은순' },
]

export function NewsListManager({ items, page, totalPages, hiddenCount, status, sort }: NewsListManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmRowId, setConfirmRowId] = useState<string | null>(null)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [confirmHidden, setConfirmHidden] = useState(false)

  useEffect(() => {
    setSelectedIds(new Set())
    setConfirmRowId(null)
    setConfirmBulk(false)
  }, [page, status, sort])

  function buildUrl(overrides: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'list')
    for (const [key, value] of Object.entries(overrides)) params.set(key, String(value))
    return `/admin/news?${params.toString()}`
  }

  function applyFilter(next: Partial<{ status: NewsStatusFilter; sort: NewsSortOption }>) {
    router.push(buildUrl({ status, sort, ...next, page: 1 }))
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === items.length ? new Set() : new Set(items.map((item) => item.id))))
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleVisible(id: string, isVisible: boolean) {
    setPendingId(id)
    startTransition(async () => {
      await fetch(`/api/admin/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !isVisible }),
      })
      setPendingId(null)
      router.refresh()
    })
  }

  function deleteOne(id: string) {
    setPendingId(id)
    startTransition(async () => {
      await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setConfirmRowId(null)
      setPendingId(null)
      router.refresh()
    })
  }

  function deleteSelected() {
    startTransition(async () => {
      await fetch('/api/admin/news/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      setSelectedIds(new Set())
      setConfirmBulk(false)
      router.refresh()
    })
  }

  function deleteHidden() {
    startTransition(async () => {
      await fetch('/api/admin/news/delete-hidden', { method: 'POST' })
      setSelectedIds(new Set())
      setConfirmHidden(false)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => applyFilter({ status: opt.value })}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  status === opt.value ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => applyFilter({ sort: e.target.value as NewsSortOption })}
            className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {confirmHidden ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1">숨김 {hiddenCount}건을 모두 삭제할까요?</span>
            <button
              onClick={deleteHidden}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              {isPending ? '삭제 중…' : '확인'}
            </button>
            <button
              onClick={() => setConfirmHidden(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmHidden(true)}
            disabled={hiddenCount === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {`숨김 전체 삭제 (${hiddenCount})`}
          </button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-[#1B3A6B]/5 border border-[#1B3A6B]/10 rounded-lg px-4 py-2 mb-3">
          <span className="text-sm text-[#1B3A6B] font-medium">{selectedIds.size}건 선택됨</span>
          <div className="flex items-center gap-2">
            {confirmBulk ? (
              <>
                <button
                  onClick={deleteSelected}
                  disabled={isPending}
                  className="text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 transition-colors"
                >
                  {isPending ? '삭제 중…' : '확인'}
                </button>
                <button
                  onClick={() => setConfirmBulk(false)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmBulk(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
              >
                선택 삭제
              </button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 accent-[#1B3A6B]"
                  aria-label="현재 페이지 전체 선택"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-16">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">제목</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-28">카테고리</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-24">출처</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-20 hidden sm:table-cell">관련도</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-28 hidden md:table-cell">발행일</th>
              <th className="w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  수집된 뉴스가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-3.5 h-3.5 accent-[#1B3A6B]"
                      aria-label={`${item.title} 선택`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`w-2 h-2 rounded-full inline-block ${item.isVisible ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-800 truncate">{item.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.categoryColorClass}`}>
                      {item.categoryLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[96px]">{item.sourceName}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{item.relevanceLabel}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{item.publishedAtLabel}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleVisible(item.id, item.isVisible)}
                        disabled={isPending && pendingId === item.id}
                        title={item.isVisible ? '비공개로 전환' : '공개로 전환'}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          item.isVisible ? 'text-gray-400 hover:text-red-500' : 'text-gray-300 hover:text-green-500'
                        }`}
                      >
                        {item.isVisible ? '숨김' : '공개'}
                      </button>
                      {confirmRowId === item.id ? (
                        <>
                          <button
                            onClick={() => deleteOne(item.id)}
                            disabled={isPending}
                            className="text-xs px-2 py-1 rounded bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 transition-colors"
                          >
                            확인
                          </button>
                          <button
                            onClick={() => setConfirmRowId(null)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmRowId(item.id)}
                          className="text-xs px-2 py-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          {page > 1 && (
            <Link href={buildUrl({ status, sort, page: page - 1 })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
              ← 이전
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const mid = Math.min(Math.max(page, 4), totalPages - 3)
            const start = Math.max(1, mid - 3)
            const n = start + i
            if (n > Math.min(totalPages, start + 6)) return null
            return (
              <Link
                key={n}
                href={buildUrl({ status, sort, page: n })}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                  n === page ? 'bg-[#1B3A6B] text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                {n}
              </Link>
            )
          })}
          {page < totalPages && (
            <Link href={buildUrl({ status, sort, page: page + 1 })} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
              다음 →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
