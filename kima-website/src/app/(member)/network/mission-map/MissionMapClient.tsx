'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export interface GmfsnsOrg {
  key?: string
  id: number | string
  prismaId?: string        // Prisma cuid — used for detail page URL
  source?: 'json' | 'db'
  name: string
  type: string
  languages: string[]
  targets: string[]
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  description: string | null
  introLines?: string[]
  contactItems?: string[]
  image: string | null
  date: string | null
  lat: number | null
  lng: number | null
}

interface Props {
  orgs: GmfsnsOrg[]
}

const TYPE_OPTIONS = ['교회', 'NGO', '법률', '의료', '교육', '센터', '선교단체', '부설기관', '기타']
const TARGET_OPTIONS = ['이주노동자', '유학생', '결혼이민자', '다문화자녀', '난민미등록', '귀국이주민', '중보사역', '기타']

const LANG_TO_DISPLAY: Record<string, string> = {
  '네팔': '네팔어', '네팔어': '네팔어',
  '베트남': '베트남어', '베트남어': '베트남어',
  '태국': '태국어', '태국어': '태국어',
  '라오': '라오스어', '라오스': '라오스어', '라오스어': '라오스어',
  '몽족': '몽골어', '몽골': '몽골어', '몽골어': '몽골어',
  '러시아': '러시아어', '러시아어': '러시아어',
  '중국': '중국&동포', '동포': '중국&동포', '중국&동포': '중국&동포',
  '필리핀': '필리핀어', '필리핀어': '필리핀어',
  '인도네시아': '인도네시아어', '인도네시아어': '인도네시아어',
  '캄보디아': '캄보디아어', '캄보디아어': '캄보디아어',
  '미얀마': '미얀마어', '미얀마어': '미얀마어',
  '영어': '영어',
  '일본': '일본어', '일본어': '일본어',
  '스리랑카': '스리랑카어', '스리랑카어': '스리랑카어',
  '아랍': '아랍어', '아랍어': '아랍어',
  '힌두': '힌디어', '이슬람': '힌디어', '인도': '힌디어', '힌디어': '힌디어',
  '우즈벡': '우즈베크어', '우즈베키스탄': '우즈베크어', '우즈베크': '우즈베크어', '우즈베크어': '우즈베크어',
  '벵골': '벵골어', '방글라데시': '벵골어', '벵골어': '벵골어',
  '카자흐': '카자흐어', '카자흐스탄': '카자흐어', '카자흐어': '카자흐어',
  '키르기즈': '키르기즈어', '키르기스스탄': '키르기즈어', '키르기즈어': '키르기즈어',
  '우르두': '우르두어', '파키스탄': '우르두어', '우르두어': '우르두어',
  '다문화': '기타', '한국어': '기타', '이주민': '기타',
}

const LANG_DISPLAY_OPTIONS = [
  '네팔어', '베트남어', '태국어', '라오스어', '몽골어', '러시아어',
  '중국&동포', '필리핀어', '캄보디아어', '미얀마어', '영어', '일본어',
  '스리랑카어', '아랍어', '힌디어',
  '인도네시아어', '우즈베크어', '벵골어', '카자흐어', '키르기즈어', '우르두어',
  '기타',
]

function orgDisplayLangs(org: GmfsnsOrg): string[] {
  const set = new Set(org.languages.map((l) => LANG_TO_DISPLAY[l] ?? l))
  return [...set]
}

function sortOrgs(orgs: GmfsnsOrg[], sortKey: string): GmfsnsOrg[] {
  return [...orgs].sort((a, b) => {
    const aKo = /^[가-힣]/.test(a.name)
    const bKo = /^[가-힣]/.test(b.name)
    if (sortKey === 'default' || sortKey === 'name-ko') {
      if (aKo && !bKo) return -1
      if (!aKo && bKo) return 1
    }
    if (sortKey === 'name-en') {
      if (!aKo && bKo) return -1
      if (aKo && !bKo) return 1
    }
    return a.name.localeCompare(b.name, 'ko')
  })
}

export function MissionMapClient({ orgs }: Props) {
  const [typeFilters, setTypeFilters]     = useState<Set<string>>(new Set())
  const [targetFilters, setTargetFilters] = useState<Set<string>>(new Set())
  const [langFilters, setLangFilters]     = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery]     = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [sortKey, setSortKey]             = useState('default')

  const availableLangDisplays = useMemo(() => {
    const s = new Set(orgs.flatMap((o) => orgDisplayLangs(o)))
    return LANG_DISPLAY_OPTIONS.filter((l) => s.has(l))
  }, [orgs])

  const toggle = (_set: Set<string>, val: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter((prev: Set<string>) => { const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n })
  }

  const clearAll = () => {
    setTypeFilters(new Set()); setTargetFilters(new Set())
    setLangFilters(new Set()); setSearchQuery(''); setSearchApplied('')
  }

  const filtered = useMemo(() => {
    const result = orgs.filter((org) => {
      if (typeFilters.size > 0 && !typeFilters.has(org.type)) return false
      if (targetFilters.size > 0) {
        const targets = org.targets || []
        if (!targets.some((t) => targetFilters.has(t))) return false
      }
      if (langFilters.size > 0) {
        const orgLangs = orgDisplayLangs(org)
        if (!orgLangs.some((l) => langFilters.has(l))) return false
      }
      if (searchApplied) {
        const q = searchApplied.toLowerCase()
        const hit =
          org.name.toLowerCase().includes(q) ||
          (org.description || '').toLowerCase().includes(q) ||
          (org.address || '').toLowerCase().includes(q) ||
          org.languages.some((l) => l.includes(q)) ||
          (org.targets || []).some((t) => t.includes(q))
        if (!hit) return false
      }
      return true
    })
    return sortOrgs(result, sortKey)
  }, [orgs, typeFilters, targetFilters, langFilters, searchApplied, sortKey])

  const hasFilter = typeFilters.size > 0 || targetFilters.size > 0 || langFilters.size > 0 || !!searchApplied

  const knownTypes = new Set(TYPE_OPTIONS)

  const groupedByType = useMemo(() => {
    const groups = TYPE_OPTIONS.map((type) => ({
      type,
      orgs: filtered.filter((o) => o.type === type),
    }))
    const unclassified = filtered.filter((o) => !knownTypes.has(o.type))
    if (unclassified.length > 0) groups.push({ type: '미분류', orgs: unclassified })
    return groups.filter((g) => g.orgs.length > 0)
  }, [filtered])

  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-[#C8922A] text-xs font-semibold tracking-widest uppercase mb-1">Network</p>
          <h1 className="text-2xl font-bold">유형별 단체 현황</h1>
          <p className="text-blue-200 text-sm mt-1">사역단체 전국지도 · {orgs.length}개 단체</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Filters ─────────────────────────────────── */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-5 mb-6 space-y-4">

          {/* 유형 */}
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-14 pt-0.5 shrink-0">유형</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {TYPE_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={typeFilters.has(t)}
                    onChange={() => toggle(typeFilters, t, setTypeFilters)}
                    className="w-3.5 h-3.5 accent-[#1B3A6B]"
                  />
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 사역대상 */}
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-14 pt-0.5 shrink-0">사역<br/>대상</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {TARGET_OPTIONS.map((t) => (
                <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={targetFilters.has(t)}
                    onChange={() => toggle(targetFilters, t, setTargetFilters)}
                    className="w-3.5 h-3.5 accent-[#1B3A6B]"
                  />
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 언어 */}
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-14 pt-0.5 shrink-0">언어</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {(availableLangDisplays.length > 0 ? availableLangDisplays : LANG_DISPLAY_OPTIONS).map((l) => (
                <label key={l} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={langFilters.has(l)}
                    onChange={() => toggle(langFilters, l, setLangFilters)}
                    className="w-3.5 h-3.5 accent-[#1B3A6B]"
                  />
                  <span className="text-sm text-gray-700">{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 검색 */}
          <div className="flex flex-wrap gap-2 pt-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearchApplied(searchQuery) }}
              placeholder="단체명, 지역, 언어 검색..."
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
            <button
              type="button"
              onClick={() => setSearchApplied(searchQuery)}
              className="px-5 py-2 bg-[#1B3A6B] text-white text-sm font-medium rounded-lg hover:bg-[#15305a] transition-colors"
            >
              검색
            </button>
            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        {/* ── Result count + Sort ─────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-500">
            총 <span className="font-bold text-[#1B3A6B]">{filtered.length}</span>개 단체
          </p>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            title="정렬 기준"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          >
            <option value="default">정렬: 한국어 우선</option>
            <option value="name-en">정렬: 영어 우선</option>
          </select>
        </div>

        {/* ── 유형별 섹션 ─────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-gray-400">
            <p className="text-base font-medium">검색 결과가 없습니다</p>
            <button type="button" onClick={clearAll} className="mt-3 text-sm text-[#1B3A6B] font-medium hover:underline">
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {groupedByType.map(({ type, orgs: typeOrgs }) => (
              <section key={type}>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-lg font-bold text-[#1B3A6B] whitespace-nowrap">{type}</h2>
                  <span className="text-sm text-gray-400 whitespace-nowrap">{typeOrgs.length}개</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {typeOrgs.map((org) => (
                    <OrgCard key={org.key ?? String(org.id)} org={org} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrgCard({ org }: { org: GmfsnsOrg }) {
  const excerpt = org.introLines?.length
    ? org.introLines.slice(0, 2).join(' / ')
    : (org.description || '').slice(0, 80)

  const displayLangs = orgDisplayLangs(org)
  const href = org.source === 'db'
    ? `/directory/${org.id}`
    : `/network/mission-map/${org.id}`

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gray-200 transition-all"
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
        {org.image ? (
          <Image
            src={org.image}
            alt={org.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1B3A6B]/10 to-[#1B3A6B]/20">
            <svg className="w-12 h-12 text-[#1B3A6B]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#1B3A6B] transition-colors line-clamp-2">
          {org.name}
        </h3>

        {org.date && (
          <p className="mt-1 text-xs text-gray-400">{org.date}</p>
        )}

        {displayLangs.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {displayLangs.slice(0, 3).map((l) => (
              <span key={l} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium">{l}</span>
            ))}
            {displayLangs.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-400">+{displayLangs.length - 3}</span>
            )}
          </div>
        )}

        {(org.targets || []).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(org.targets || []).slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-green-50 text-green-700 font-medium">{t}</span>
            ))}
          </div>
        )}

        {excerpt && (
          <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">{excerpt}</p>
        )}

        <p className="mt-3 text-xs font-semibold text-[#C8922A] group-hover:underline">
          더 보기 →
        </p>
      </div>
    </Link>
  )
}
