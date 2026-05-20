'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ORG_REGIONS, LANGUAGES, TARGETS, ORG_TYPES } from '@/schemas/organization.schema'

interface FilterBarProps {
  totalCount: number
}

function parseMulti(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : []
}
function serializeMulti(arr: string[]): string {
  return arr.join(',')
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

interface FilterGroupProps {
  label: string
  paramKey: string
  items: readonly string[]
  selected: string[]
  onToggle: (key: string, current: string[], val: string) => void
}

function FilterGroup({ label, paramKey, items, selected, onToggle }: FilterGroupProps) {
  const [open, setOpen] = useState(false)
  const hasSelection = selected.length > 0

  return (
    <div>
      {/* 모바일: 접힌 헤더 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden w-full flex items-center justify-between py-1.5"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
          {hasSelection && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#1B3A6B] text-white font-semibold">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronIcon open={open} />
      </button>

      {/* 데스크탑: 항상 표시 / 모바일: 펼쳤을 때만 */}
      <div className={`flex flex-wrap items-start gap-x-4 gap-y-1.5 ${open ? 'block' : 'hidden'} sm:flex`}>
        <span className="hidden sm:block text-xs font-bold text-gray-500 uppercase tracking-wider w-10 pt-0.5 shrink-0">
          {label}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 sm:pt-0">
          {items.map((t) => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.includes(t)}
                onChange={() => onToggle(paramKey, selected, t)}
                className="w-3.5 h-3.5 accent-[#1B3A6B]"
              />
              <span className={`text-sm ${selected.includes(t) ? 'font-semibold text-[#1B3A6B]' : 'text-gray-700'}`}>
                {t}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FilterBar({ totalCount }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedRegions = parseMulti(searchParams.get('region'))
  const selectedLangs   = parseMulti(searchParams.get('language'))
  const selectedTargets = parseMulti(searchParams.get('target'))
  const selectedTypes   = parseMulti(searchParams.get('type'))
  const currentQ        = searchParams.get('q') ?? ''

  const [searchInput, setSearchInput] = useState(currentQ)
  const [filterOpen, setFilterOpen]   = useState(false)

  useEffect(() => { setSearchInput(currentQ) }, [currentQ])

  const totalSelected = selectedRegions.length + selectedLangs.length + selectedTargets.length + selectedTypes.length

  const updateParam = useCallback(
    (key: string, current: string[], val: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const next = current.includes(val)
        ? current.filter((v) => v !== val)
        : [...current, val]
      if (next.length > 0) {
        params.set(key, serializeMulti(next))
      } else {
        params.delete(key)
      }
      router.push(`/directory?${params.toString()}`)
    },
    [router, searchParams],
  )

  const applySearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput.trim()) {
      params.set('q', searchInput.trim())
    } else {
      params.delete('q')
    }
    router.push(`/directory?${params.toString()}`)
  }, [router, searchParams, searchInput])

  const clearAll = useCallback(() => {
    setSearchInput('')
    router.push('/directory')
  }, [router])

  const hasAnyFilter = totalSelected > 0 || !!currentQ

  return (
    <div className="space-y-2.5">

      {/* 검색 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') applySearch() }}
          placeholder="단체명 검색..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        />
        <button
          type="button"
          onClick={applySearch}
          className="px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium hover:bg-[#15305a] transition-colors shrink-0"
        >
          검색
        </button>
        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
          >
            초기화
          </button>
        )}
      </div>

      {/* 모바일: 필터 토글 버튼 */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span>필터</span>
            {totalSelected > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#1B3A6B] text-white text-xs font-semibold">
                {totalSelected}
              </span>
            )}
          </span>
          <ChevronIcon open={filterOpen} />
        </button>
      </div>

      {/* 필터 패널 — 모바일: 접힘/펼침 / 데스크탑: 항상 표시 */}
      <div className={`bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm space-y-2.5 ${filterOpen ? 'block' : 'hidden'} sm:block`}>
        <FilterGroup
          label="유형"
          paramKey="type"
          items={ORG_TYPES}
          selected={selectedTypes}
          onToggle={updateParam}
        />
        <div className="sm:hidden border-t border-gray-50 my-1" />
        <FilterGroup
          label="대상"
          paramKey="target"
          items={TARGETS}
          selected={selectedTargets}
          onToggle={updateParam}
        />
        <div className="sm:hidden border-t border-gray-50 my-1" />
        <FilterGroup
          label="언어"
          paramKey="language"
          items={LANGUAGES}
          selected={selectedLangs}
          onToggle={updateParam}
        />
        <div className="sm:hidden border-t border-gray-50 my-1" />
        <FilterGroup
          label="지역"
          paramKey="region"
          items={ORG_REGIONS}
          selected={selectedRegions}
          onToggle={updateParam}
        />
      </div>
    </div>
  )
}
