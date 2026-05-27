'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  type: string
  slug?: string
}

interface ResourceAdminFormProps {
  categories: Category[]
  preselectedCategoryId?: string
}

const FILE_TYPES = ['PDF', 'PPT', 'DOC', 'ETC'] as const

export function ResourceAdminForm({ categories, preselectedCategoryId = '' }: ResourceAdminFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(!!preselectedCategoryId)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    driveUrl: '',
    fileType: 'PDF' as string,
    section: 'PUBLIC' as string,
    accessLevel: 'MEMBER' as string,
    categoryId: preselectedCategoryId,
  })

  const set = (k: keyof typeof form, v: string) => setForm((prev) => ({ ...prev, [k]: v }))

  const handleSubmit = () => {
    if (!form.title.trim() || !form.driveUrl.trim()) {
      setError('제목과 드라이브 URL은 필수입니다.')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId || undefined,
          description: form.description || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? '등록에 실패했습니다.')
        return
      }
      setForm({ title: '', description: '', driveUrl: '', fileType: 'PDF', section: 'PUBLIC', accessLevel: 'MEMBER', categoryId: '' })
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] transition-colors"
      >
        + 자료 등록
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
      <h3 className="font-semibold text-gray-800">새 자료 등록</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">구글 드라이브 URL *</label>
          <input
            type="url"
            value={form.driveUrl}
            onChange={(e) => set('driveUrl', e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">설명</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">섹션</label>
            <select
              value={form.section}
              onChange={(e) => set('section', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              disabled={isPending}
            >
              <option value="PUBLIC">공개 자료</option>
              <option value="MINISTRY">사역 자료</option>
              <option value="KIMA">KIMA 자료</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">파일 형식</label>
            <select
              value={form.fileType}
              onChange={(e) => set('fileType', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              disabled={isPending}
            >
              {FILE_TYPES.map((ft) => <option key={ft}>{ft}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">접근 등급</label>
            <select
              value={form.accessLevel}
              onChange={(e) => set('accessLevel', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              disabled={isPending}
            >
              <option value="PUBLIC">공개</option>
              <option value="MEMBER">회원</option>
              <option value="PREMIUM">정회원</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">카테고리</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              disabled={isPending}
            >
              <option value="">없음</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {isPending ? '등록 중…' : '등록'}
        </button>
        <button
          onClick={() => { setOpen(false); setError('') }}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}
