'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type NewsCategory = 'LAW' | 'STATISTICS' | 'MULTICULTURAL' | 'MIGRANT_WORKER' | 'STUDENT' | 'OTHER'

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  LAW: '법령·정책', STATISTICS: '통계·연구', MULTICULTURAL: '다문화가족',
  MIGRANT_WORKER: '이주노동자', STUDENT: '유학생', OTHER: '기타',
}
const CATEGORY_COLORS: Record<NewsCategory, string> = {
  LAW: 'bg-blue-100 text-blue-700', STATISTICS: 'bg-violet-100 text-violet-700',
  MULTICULTURAL: 'bg-pink-100 text-pink-700', MIGRANT_WORKER: 'bg-amber-100 text-amber-700',
  STUDENT: 'bg-emerald-100 text-emerald-700', OTHER: 'bg-gray-100 text-gray-600',
}

interface NewsSource {
  id: string; name: string; url: string; rssUrl: string | null
  apiType: string; isEnabled: boolean; keywords: string[]
  defaultCategory: NewsCategory; order: number
}

interface SourceFormData {
  name: string; url: string; rssUrl: string; apiType: string
  isEnabled: boolean; keywords: string; defaultCategory: NewsCategory; order: number
}

const DEFAULT_FORM: SourceFormData = {
  name: '', url: '', rssUrl: '', apiType: 'rss',
  isEnabled: true, keywords: '', defaultCategory: 'OTHER', order: 0,
}

function SourceForm({
  initial, onSave, onCancel, isPending, error,
}: {
  initial: SourceFormData
  onSave: (data: SourceFormData) => void
  onCancel: () => void
  isPending: boolean
  error: string
}) {
  const [form, setForm] = useState<SourceFormData>(initial)
  const set = <K extends keyof SourceFormData>(k: K, v: SourceFormData[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">소스명 *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="예: 법제처 최신법령 RSS"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">유형 *</label>
          <select value={form.apiType} onChange={e => set('apiType', e.target.value)}
            aria-label="유형 선택"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]">
            <option value="rss">RSS</option>
            <option value="naver">네이버 뉴스 API</option>
            <option value="scraping">스크래핑</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">기본 카테고리</label>
          <select value={form.defaultCategory} onChange={e => set('defaultCategory', e.target.value as NewsCategory)}
            aria-label="기본 카테고리 선택"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]">
            {(Object.entries(CATEGORY_LABELS) as [NewsCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">홈페이지 URL *</label>
          <input value={form.url} onChange={e => set('url', e.target.value)}
            placeholder="https://example.com"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]" />
        </div>
        {form.apiType === 'rss' && (
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">RSS URL</label>
            <input value={form.rssUrl} onChange={e => set('rssUrl', e.target.value)}
              placeholder="https://example.com/rss.xml"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]" />
          </div>
        )}
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">
            필터 키워드
            <span className="ml-1 text-gray-400 font-normal">(쉼표로 구분 · 비워두면 전체 수집)</span>
          </label>
          <input value={form.keywords} onChange={e => set('keywords', e.target.value)}
            placeholder="이주민, 다문화, 외국인"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
          <input type="number" value={form.order} onChange={e => set('order', parseInt(e.target.value) || 0)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]" />
        </div>
        <div className="flex items-center gap-3 pt-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.isEnabled}
              onChange={e => set('isEnabled', e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B3A6B]" />
          </label>
          <span className="text-sm text-gray-700">활성화</span>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => onSave(form)} disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50">
          {isPending ? '저장 중…' : '저장'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
          취소
        </button>
      </div>
    </div>
  )
}

interface Props {
  initialSources: NewsSource[]
}

export function NewsSourceManager({ initialSources }: Props) {
  const router = useRouter()
  const [sources, setSources] = useState<NewsSource[]>(initialSources)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function formDataToPayload(form: SourceFormData) {
    return {
      name:            form.name.trim(),
      url:             form.url.trim(),
      rssUrl:          form.rssUrl.trim() || null,
      apiType:         form.apiType,
      isEnabled:       form.isEnabled,
      keywords:        form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      defaultCategory: form.defaultCategory,
      order:           form.order,
    }
  }

  const handleAdd = (form: SourceFormData) => {
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/admin/news-sources', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToPayload(form)),
      })
      const data = await res.json() as { source?: NewsSource; error?: string }
      if (!res.ok) { setError(data.error ?? '추가 실패'); return }
      setSources(prev => [...prev, data.source!])
      setShowAdd(false)
      router.refresh()
    })
  }

  const handleEdit = (id: string, form: SourceFormData) => {
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-sources/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToPayload(form)),
      })
      const data = await res.json() as { source?: NewsSource; error?: string }
      if (!res.ok) { setError(data.error ?? '수정 실패'); return }
      setSources(prev => prev.map(s => s.id === id ? data.source! : s))
      setEditingId(null)
      router.refresh()
    })
  }

  const handleToggle = (src: NewsSource) => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-sources/${src.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !src.isEnabled }),
      })
      if (res.ok) {
        setSources(prev => prev.map(s => s.id === src.id ? { ...s, isEnabled: !s.isEnabled } : s))
      }
    })
  }

  const handleDelete = (src: NewsSource) => {
    if (!confirm(`"${src.name}" 소스를 삭제하시겠습니까?`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-sources/${src.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSources(prev => prev.filter(s => s.id !== src.id))
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">RSS · 네이버 API 소스 {sources.length}개</p>
        <button type="button" onClick={() => { setShowAdd(true); setEditingId(null); setError('') }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium hover:bg-[#142d54] transition-colors">
          + 소스 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <SourceForm
          initial={DEFAULT_FORM}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setError('') }}
          isPending={isPending}
          error={error}
        />
      )}

      {/* 소스 목록 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-12">상태</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">소스명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">유형</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-28 hidden md:table-cell">카테고리</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">키워드</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sources.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">등록된 소스가 없습니다.</td></tr>
            ) : sources.map(src => (
              <tr key={src.id}>
                {editingId === src.id ? (
                  <td colSpan={6} className="p-4">
                    <SourceForm
                      initial={{
                        name: src.name, url: src.url, rssUrl: src.rssUrl ?? '',
                        apiType: src.apiType, isEnabled: src.isEnabled,
                        keywords: (src.keywords as string[]).join(', '),
                        defaultCategory: src.defaultCategory, order: src.order,
                      }}
                      onSave={form => handleEdit(src.id, form)}
                      onCancel={() => { setEditingId(null); setError('') }}
                      isPending={isPending}
                      error={error}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => handleToggle(src)} title={src.isEnabled ? '비활성화' : '활성화'}>
                        <span className={`w-2.5 h-2.5 rounded-full inline-block transition-colors ${src.isEnabled ? 'bg-green-400' : 'bg-gray-300'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{src.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{src.rssUrl ?? src.url}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono uppercase">{src.apiType}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[src.defaultCategory]}`}>
                        {CATEGORY_LABELS[src.defaultCategory]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(src.keywords as string[]).slice(0, 3).map(kw => (
                          <span key={kw} className="px-1.5 py-0.5 rounded bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs">{kw}</span>
                        ))}
                        {src.keywords.length > 3 && (
                          <span className="text-xs text-gray-400">+{src.keywords.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => { setEditingId(src.id); setShowAdd(false); setError('') }}
                          className="p-1.5 rounded text-gray-400 hover:text-[#1B3A6B] hover:bg-blue-50" title="수정">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => handleDelete(src)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50" title="삭제">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
