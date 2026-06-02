'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoryType } from '@prisma/client'
import { convertDriveUrl } from '@/lib/utils'
import { uploadResourceFile } from '@/lib/uploadClient'

interface Props {
  type: CategoryType
}

const TYPE_LABELS: Record<CategoryType, string> = {
  REGION:   '지역',
  LANGUAGE: '언어권',
  TARGET:   '사역대상',
}

const PLACEHOLDERS: Record<CategoryType, { name: string; slug: string }> = {
  REGION:   { name: '예) 제주', slug: 'jeju' },
  LANGUAGE: { name: '예) 베트남', slug: 'vietnam' },
  TARGET:   { name: '예) 이주노동자', slug: 'worker' },
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CategoryAddForm({ type }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [flag, setFlag] = useState<string | null>(null)
  const [flagUploading, setFlagUploading] = useState(false)
  const [error, setError] = useState('')
  const flagInputRef = useRef<HTMLInputElement>(null)

  const handleNameChange = (v: string) => {
    setName(v)
    if (!slugTouched) setSlug(toSlug(v))
  }

  const handleSlugChange = (v: string) => {
    setSlug(v)
    setSlugTouched(true)
  }

  const handleFlagSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setFlagUploading(true)
    try {
      const uploaded = await uploadResourceFile(file)
      setFlag(uploaded.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '국기 이미지 업로드 실패')
    } finally {
      setFlagUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }
    if (!slug.trim()) { setError('slug를 입력해주세요.'); return }
    if (!/^[a-z0-9-]+$/.test(slug)) { setError('slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다.'); return }
    setError('')

    startTransition(async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: name.trim(), slug: slug.trim(), flag }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '등록에 실패했습니다.')
        return
      }
      setName('')
      setSlug('')
      setSlugTouched(false)
      setFlag(null)
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-[#1B3A6B] font-medium px-3 py-1.5 rounded-lg border border-[#1B3A6B]/30 hover:bg-[#1B3A6B]/5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {TYPE_LABELS[type]} 추가
      </button>
    )
  }

  return (
    <div className="mt-3 p-4 bg-blue-50/60 rounded-xl border border-[#1B3A6B]/20 space-y-3">
      <p className="text-xs font-semibold text-[#1B3A6B]">새 {TYPE_LABELS[type]} 카테고리 추가</p>

      <div>
        <label className="block text-xs text-gray-500 mb-1">이름 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={PLACEHOLDERS[type].name}
          disabled={isPending}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">
          slug * <span className="text-gray-400 font-normal">(URL에 사용, 소문자·숫자·하이픈만)</span>
        </label>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 flex-shrink-0">/community/{type.toLowerCase()}/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder={PLACEHOLDERS[type].slug}
            disabled={isPending}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
          />
        </div>
      </div>

      {/* 국기 이미지 (언어권만) */}
      {type === 'LANGUAGE' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">국기 이미지 (선택)</label>
          <input ref={flagInputRef} type="file" accept="image/*" aria-label="국기 이미지 선택" className="hidden" onChange={handleFlagSelect} />
          <div className="flex items-center gap-3">
            {flag ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={convertDriveUrl(flag)} alt="국기" className="w-16 h-11 object-cover rounded border border-gray-200 shadow-sm" />
                <button type="button" onClick={() => setFlag(null)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">×</button>
              </div>
            ) : (
              <button type="button" onClick={() => flagInputRef.current?.click()} disabled={flagUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[#1B3A6B] hover:text-[#1B3A6B] disabled:opacity-50 transition-colors">
                {flagUploading ? '업로드 중...' : '+ 국기 이미지 업로드'}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || flagUploading}
          className="px-4 py-1.5 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {isPending ? '추가 중…' : '추가'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(''); setName(''); setSlug(''); setSlugTouched(false); setFlag(null) }}
          className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}

// ── Rename (name/slug edit) ────────────────────────────────────

interface RenameProps {
  categoryId: string
  name: string
  slug: string
  type: CategoryType
  flag?: string | null
}

export function CategoryRenameForm({ categoryId, name, slug, type, flag: initialFlag }: RenameProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState(name)
  const [newSlug, setNewSlug] = useState(slug)
  const [slugTouched, setSlugTouched] = useState(false)
  const [newFlag, setNewFlag] = useState<string | null>(initialFlag ?? null)
  const [flagUploading, setFlagUploading] = useState(false)
  const [error, setError] = useState('')
  const flagInputRef = useRef<HTMLInputElement>(null)

  const handleFlagSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setFlagUploading(true)
    try {
      const uploaded = await uploadResourceFile(file)
      setNewFlag(uploaded.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : '국기 이미지 업로드 실패')
    } finally {
      setFlagUploading(false)
    }
  }

  function handleNameChange(v: string) {
    setNewName(v)
    if (!slugTouched) setNewSlug(toSlug(v))
  }

  function handleOpen() {
    setNewName(name)
    setNewSlug(slug)
    setNewFlag(initialFlag ?? null)
    setSlugTouched(false)
    setError('')
    setOpen(true)
  }

  function handleSave() {
    if (!newName.trim()) { setError('이름을 입력해주세요.'); return }
    if (!newSlug.trim()) { setError('slug를 입력해주세요.'); return }
    if (!/^[a-z0-9-]+$/.test(newSlug)) { setError('slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다.'); return }
    setError('')

    startTransition(async () => {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), flag: newFlag }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '수정에 실패했습니다.')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2 group">
        {/* 국기 미리보기 */}
        {type === 'LANGUAGE' && (initialFlag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={convertDriveUrl(initialFlag)} alt={`${name} 국기`} className="w-10 h-7 object-cover rounded border border-gray-200 shadow-sm flex-shrink-0" />
        ) : (
          <div className="w-10 h-7 rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-300 flex-shrink-0 text-[10px]">국기</div>
        ))}
        <div>
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">/{slug}</p>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          title="수정"
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-[#1B3A6B] hover:bg-gray-100 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2 min-w-[180px]">
      <input
        type="text"
        value={newName}
        onChange={(e) => handleNameChange(e.target.value)}
        disabled={isPending}
        placeholder="이름"
        className="w-full text-sm border border-[#1B3A6B] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
      />
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 flex-shrink-0">{type.toLowerCase()}/</span>
        <input
          type="text"
          value={newSlug}
          onChange={(e) => { setNewSlug(e.target.value); setSlugTouched(true) }}
          disabled={isPending}
          placeholder="slug"
          className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] min-w-0"
        />
      </div>

      {/* 국기 이미지 (언어권만) */}
      {type === 'LANGUAGE' && (
        <div>
          <p className="text-xs text-gray-400 mb-1">국기 이미지</p>
          <input ref={flagInputRef} type="file" accept="image/*" aria-label="국기 이미지 선택" className="hidden" onChange={handleFlagSelect} />
          <div className="flex items-center gap-2">
            {newFlag ? (
              <div className="relative group/flag">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={convertDriveUrl(newFlag)} alt="국기" className="w-14 h-10 object-cover rounded border border-gray-200 shadow-sm" />
                <button type="button" onClick={() => setNewFlag(null)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-600">×</button>
              </div>
            ) : (
              <button type="button" onClick={() => flagInputRef.current?.click()} disabled={flagUploading}
                className="flex items-center gap-1 px-2 py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-[#1B3A6B] hover:text-[#1B3A6B] disabled:opacity-50 transition-colors">
                {flagUploading ? '업로드 중...' : '+ 국기 업로드'}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || flagUploading}
          className="px-3 py-1 rounded bg-[#1B3A6B] text-white text-xs hover:bg-[#142d54] disabled:opacity-50"
        >
          {isPending ? '…' : '저장'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1 rounded border border-gray-200 text-gray-500 text-xs hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </div>
  )
}

// ── Delete button ──────────────────────────────────────────────

interface DeleteProps {
  categoryId: string
  categoryName: string
  categoryType: CategoryType
}

export function CategoryDeleteButton({ categoryId, categoryName, categoryType: _categoryType }: DeleteProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleDelete = () => {
    if (!confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?\n연결된 게시글이나 자료가 있으면 삭제되지 않습니다.`)) return
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '삭제에 실패했습니다.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        title="카테고리 삭제"
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
