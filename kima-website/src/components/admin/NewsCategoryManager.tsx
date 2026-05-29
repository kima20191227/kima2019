'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { NewsCategoryConfig } from '@/lib/newsCategoryConfig'

type FormData = {
  key: string
  label: string
  colorClass: string
  keywords: string
  order: number
  isEnabled: boolean
}

const COLOR_OPTIONS = [
  { label: '회색', value: 'bg-gray-100 text-gray-600' },
  { label: '파랑', value: 'bg-blue-100 text-blue-700' },
  { label: '보라', value: 'bg-violet-100 text-violet-700' },
  { label: '분홍', value: 'bg-pink-100 text-pink-700' },
  { label: '주황', value: 'bg-amber-100 text-amber-700' },
  { label: '초록', value: 'bg-emerald-100 text-emerald-700' },
  { label: '청록', value: 'bg-cyan-100 text-cyan-700' },
  { label: '남색', value: 'bg-indigo-100 text-indigo-700' },
]

const DEFAULT_FORM: FormData = {
  key: '',
  label: '',
  colorClass: COLOR_OPTIONS[0].value,
  keywords: '',
  order: 100,
  isEnabled: true,
}

function toForm(category: NewsCategoryConfig): FormData {
  return {
    key: category.key,
    label: category.label,
    colorClass: category.colorClass,
    keywords: category.keywords.join(', '),
    order: category.order,
    isEnabled: category.isEnabled,
  }
}

function toPayload(form: FormData, includeKey: boolean) {
  return {
    ...(includeKey ? { key: form.key.trim() || undefined } : {}),
    label: form.label.trim(),
    colorClass: form.colorClass,
    keywords: form.keywords.split(',').map((keyword) => keyword.trim()).filter(Boolean),
    order: form.order,
    isEnabled: form.isEnabled,
  }
}

function CategoryForm({
  initial,
  editingSystem,
  isPending,
  error,
  onSave,
  onCancel,
}: {
  initial: FormData
  editingSystem?: boolean
  isPending: boolean
  error: string
  onSave: (form: FormData) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">코드</label>
          <input
            value={form.key}
            onChange={(event) => set('key', event.target.value)}
            disabled={editingSystem}
            placeholder="예: REFUGEE"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">표시 이름 *</label>
          <input
            value={form.label}
            onChange={(event) => set('label', event.target.value)}
            placeholder="예: 난민·미등록"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">색상</label>
          <select
            value={form.colorClass}
            onChange={(event) => set('colorClass', event.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            {COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">정렬</label>
          <input
            type="number"
            value={form.order}
            onChange={(event) => set('order', Number(event.target.value) || 0)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-500 mb-1">분류 키워드</label>
          <input
            value={form.keywords}
            onChange={(event) => set('keywords', event.target.value)}
            placeholder="쉼표로 구분: 난민, 미등록, 체류자격"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(event) => set('isEnabled', event.target.checked)}
          />
          사용
        </label>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
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

export function NewsCategoryManager({ initialCategories }: { initialCategories: NewsCategoryConfig[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [showAdd, setShowAdd] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function addCategory(form: FormData) {
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/admin/news-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form, true)),
      })
      const data = await res.json() as { category?: NewsCategoryConfig; error?: string }
      if (!res.ok) {
        setError(data.error ?? '카테고리 추가에 실패했습니다.')
        return
      }
      setCategories((prev) => [...prev, data.category!].sort((a, b) => a.order - b.order))
      setShowAdd(false)
      router.refresh()
    })
  }

  function editCategory(key: string, form: FormData) {
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-categories/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(form, false)),
      })
      const data = await res.json() as { category?: NewsCategoryConfig; error?: string }
      if (!res.ok) {
        setError(data.error ?? '카테고리 수정에 실패했습니다.')
        return
      }
      setCategories((prev) => prev.map((category) => category.key === key ? data.category! : category).sort((a, b) => a.order - b.order))
      setEditingKey(null)
      router.refresh()
    })
  }

  function deleteCategory(category: NewsCategoryConfig) {
    if (!confirm(`"${category.label}" 카테고리를 삭제하시겠습니까?`)) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/news-categories/${encodeURIComponent(category.key)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? '카테고리 삭제에 실패했습니다.')
        return
      }
      setCategories((prev) => prev.filter((item) => item.key !== category.key))
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">뉴스 분류 카테고리 {categories.length}개</p>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setEditingKey(null); setError('') }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium"
        >
          + 카테고리 추가
        </button>
      </div>

      {showAdd && (
        <CategoryForm
          initial={DEFAULT_FORM}
          isPending={isPending}
          error={error}
          onSave={addCategory}
          onCancel={() => { setShowAdd(false); setError('') }}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">카테고리</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">키워드</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-20">상태</th>
              <th className="w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((category) => (
              <tr key={category.key}>
                {editingKey === category.key ? (
                  <td colSpan={4} className="p-4">
                    <CategoryForm
                      initial={toForm(category)}
                      editingSystem={category.isSystem}
                      isPending={isPending}
                      error={error}
                      onSave={(form) => editCategory(category.key, form)}
                      onCancel={() => { setEditingKey(null); setError('') }}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${category.colorClass}`}>
                          {category.label}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{category.key}</span>
                        {category.isSystem && <span className="text-[11px] text-gray-400">기본</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {category.keywords.slice(0, 6).map((keyword) => (
                          <span key={keyword} className="px-1.5 py-0.5 rounded bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${category.isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                        {category.isEnabled ? '사용' : '숨김'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditingKey(category.key); setShowAdd(false); setError('') }}
                          className="px-2 py-1 rounded text-xs text-gray-500 hover:text-[#1B3A6B] hover:bg-blue-50"
                        >
                          수정
                        </button>
                        {!category.isSystem && (
                          <button
                            type="button"
                            onClick={() => deleteCategory(category)}
                            className="px-2 py-1 rounded text-xs text-gray-500 hover:text-red-500 hover:bg-red-50"
                          >
                            삭제
                          </button>
                        )}
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
