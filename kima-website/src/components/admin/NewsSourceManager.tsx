'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getNewsCategoryMeta, type NewsCategoryConfig } from '@/lib/newsCategoryConfig'

interface NewsSource {
  id: string
  name: string
  url: string
  rssUrl: string | null
  apiType: string
  isEnabled: boolean
  keywords: string[]
  defaultCategory: string
  order: number
}

interface SourceFormData {
  name: string
  url: string
  rssUrl: string
  apiType: string
  isEnabled: boolean
  keywords: string
  defaultCategory: string
  order: number
}

function defaultForm(categories: NewsCategoryConfig[]): SourceFormData {
  return {
    name: '',
    url: '',
    rssUrl: '',
    apiType: 'rss',
    isEnabled: true,
    keywords: '',
    defaultCategory: categories[0]?.key ?? 'OTHER',
    order: 0,
  }
}

function SourceForm({
  initial,
  categories,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  initial: SourceFormData
  categories: NewsCategoryConfig[]
  onSave: (data: SourceFormData) => void
  onCancel: () => void
  isPending: boolean
  error: string
}) {
  const [form, setForm] = useState<SourceFormData>(initial)
  const set = <K extends keyof SourceFormData>(key: K, value: SourceFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">소스명 *</label>
          <input
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="예: 네이버 뉴스 — 난민"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">유형 *</label>
          <select
            value={form.apiType}
            onChange={(event) => set('apiType', event.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="rss">RSS</option>
            <option value="naver">네이버 뉴스 API</option>
            <option value="scraping">스크래핑</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">기본 카테고리</label>
          <select
            value={form.defaultCategory}
            onChange={(event) => set('defaultCategory', event.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            {categories.map((category) => (
              <option key={category.key} value={category.key}>{category.label}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">홈페이지 URL *</label>
          <input
            value={form.url}
            onChange={(event) => set('url', event.target.value)}
            placeholder="https://example.com"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        {form.apiType === 'rss' && (
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">RSS URL</label>
            <input
              value={form.rssUrl}
              onChange={(event) => set('rssUrl', event.target.value)}
              placeholder="https://example.com/rss.xml"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
        )}
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">
            필터 키워드
            <span className="ml-1 text-gray-400 font-normal">(쉼표로 구분)</span>
          </label>
          <input
            value={form.keywords}
            onChange={(event) => set('keywords', event.target.value)}
            placeholder="다문화가족, 결혼이민자, 다문화 자녀"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
          <input
            type="number"
            value={form.order}
            onChange={(event) => set('order', parseInt(event.target.value, 10) || 0)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <label className="flex items-center gap-3 pt-6 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(event) => set('isEnabled', event.target.checked)}
          />
          활성화
        </label>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium disabled:opacity-50"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm"
        >
          취소
        </button>
      </div>
    </div>
  )
}

interface Props {
  initialSources: NewsSource[]
  categories: NewsCategoryConfig[]
}

export function NewsSourceManager({ initialSources, categories }: Props) {
  const router = useRouter()
  const [sources, setSources] = useState<NewsSource[]>(initialSources)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function formDataToPayload(form: SourceFormData) {
    return {
      name: form.name.trim(),
      url: form.url.trim(),
      rssUrl: form.rssUrl.trim() || null,
      apiType: form.apiType,
      isEnabled: form.isEnabled,
      keywords: form.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
      defaultCategory: form.defaultCategory,
      order: form.order,
    }
  }

  const handleAdd = (form: SourceFormData) => {
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/admin/news-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToPayload(form)),
      })
      const data = await res.json() as { source?: NewsSource; error?: string }
      if (!res.ok) {
        setError(data.error ?? '추가에 실패했습니다.')
        return
      }
      setSources((prev) => [...prev, data.source!])
      setShowAdd(false)
      router.refresh()
    })
  }

  const handleEdit = (id: string, form: SourceFormData) => {
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataToPayload(form)),
      })
      const data = await res.json() as { source?: NewsSource; error?: string }
      if (!res.ok) {
        setError(data.error ?? '수정에 실패했습니다.')
        return
      }
      setSources((prev) => prev.map((source) => source.id === id ? data.source! : source))
      setEditingId(null)
      router.refresh()
    })
  }

  const handleToggle = (source: NewsSource) => {
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !source.isEnabled }),
      })
      if (res.ok) {
        setSources((prev) => prev.map((item) => item.id === source.id ? { ...item, isEnabled: !item.isEnabled } : item))
      }
    })
  }

  const handleDelete = (source: NewsSource) => {
    if (!confirm(`"${source.name}" 소스를 삭제하시겠습니까?`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-sources/${source.id}`, { method: 'DELETE' })
      if (res.ok) {
        setSources((prev) => prev.filter((item) => item.id !== source.id))
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">RSS · 네이버 API 소스 {sources.length}개</p>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditingId(null); setError('') }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium"
        >
          + 소스 추가
        </button>
      </div>

      {showAdd && (
        <SourceForm
          initial={defaultForm(categories)}
          categories={categories}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setError('') }}
          isPending={isPending}
          error={error}
        />
      )}

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
            ) : sources.map((source) => {
              const meta = getNewsCategoryMeta(categories, source.defaultCategory)
              return (
                <tr key={source.id}>
                  {editingId === source.id ? (
                    <td colSpan={6} className="p-4">
                      <SourceForm
                        initial={{
                          name: source.name,
                          url: source.url,
                          rssUrl: source.rssUrl ?? '',
                          apiType: source.apiType,
                          isEnabled: source.isEnabled,
                          keywords: source.keywords.join(', '),
                          defaultCategory: source.defaultCategory,
                          order: source.order,
                        }}
                        categories={categories}
                        onSave={(form) => handleEdit(source.id, form)}
                        onCancel={() => { setEditingId(null); setError('') }}
                        isPending={isPending}
                        error={error}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => handleToggle(source)} title={source.isEnabled ? '비활성화' : '활성화'}>
                          <span className={`w-2.5 h-2.5 rounded-full inline-block ${source.isEnabled ? 'bg-green-400' : 'bg-gray-300'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{source.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{source.rssUrl ?? source.url}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono uppercase">{source.apiType}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.colorClass}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {source.keywords.slice(0, 3).map((keyword) => (
                            <span key={keyword} className="px-1.5 py-0.5 rounded bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs">{keyword}</span>
                          ))}
                          {source.keywords.length > 3 && (
                            <span className="text-xs text-gray-400">+{source.keywords.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => { setEditingId(source.id); setShowAdd(false); setError('') }}
                            className="px-2 py-1 rounded text-xs text-gray-500 hover:text-[#1B3A6B] hover:bg-blue-50"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(source)}
                            className="px-2 py-1 rounded text-xs text-gray-500 hover:text-red-500 hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
