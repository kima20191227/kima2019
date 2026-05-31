'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AccessLevel, LegalCategory, LegalSectionType } from '@prisma/client'
import {
  ACCESS_LEVEL_META,
  LEGAL_CATEGORY_META,
  LEGAL_CATEGORY_ORDER,
  LEGAL_SECTION_META,
  LEGAL_SECTION_ORDER,
  formatLegalDate,
} from '@/lib/legalCategories'
import { cn } from '@/lib/utils'

export interface LegalDocumentAdminSectionItem {
  id?: string
  type: LegalSectionType
  title: string
  content: string
  accessLevel: AccessLevel
  order: number
  authorName: string | null
  reviewedAt: string | null
  createdAt?: string
  updatedAt?: string
}

export interface LegalDocumentAdminItem {
  id: string
  title: string
  summary: string | null
  content: string
  category: LegalCategory
  lawType: string | null
  effectiveDate: string | null
  sourceUrl: string | null
  sourceId: string | null
  isLatest: boolean
  accessLevel: AccessLevel
  viewCount: number
  createdAt: string
  updatedAt: string
  sections: LegalDocumentAdminSectionItem[]
}

interface Props {
  documents: LegalDocumentAdminItem[]
}

const LAW_TYPES = ['법률', '시행령', '시행규칙', '고시', '안내', '기타']

function createDefaultSections(): LegalDocumentAdminSectionItem[] {
  return LEGAL_SECTION_ORDER.map((type, index) => ({
    type,
    title: LEGAL_SECTION_META[type].label,
    content: '',
    accessLevel: LEGAL_SECTION_META[type].defaultAccessLevel,
    order: index,
    authorName: '',
    reviewedAt: null,
  }))
}

function createEmptyForm() {
  return {
    title: '',
    summary: '',
    content: '',
    category: 'IMMIGRATION' as LegalCategory,
    lawType: '',
    effectiveDate: '',
    sourceUrl: '',
    sourceId: '',
    isLatest: true,
    accessLevel: 'PUBLIC' as AccessLevel,
    sections: createDefaultSections(),
  }
}

function toDateInput(value?: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

export function LegalDocumentAdminClient({ documents }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(documents)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(createEmptyForm)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()

  const editing = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [editingId, items],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      (item.summary ?? '').toLowerCase().includes(q) ||
      LEGAL_CATEGORY_META[item.category].label.toLowerCase().includes(q) ||
      (item.lawType ?? '').toLowerCase().includes(q) ||
      (item.sourceId ?? '').toLowerCase().includes(q),
    )
  }, [items, query])

  const resetForm = () => {
    setForm(createEmptyForm())
    setFormOpen(false)
    setEditingId(null)
    setError('')
  }

  const startEdit = (item: LegalDocumentAdminItem) => {
    setEditingId(item.id)
    setFormOpen(true)
    setError('')
    setForm({
      title: item.title,
      summary: item.summary ?? '',
      content: item.content,
      category: item.category,
      lawType: item.lawType ?? '',
      effectiveDate: toDateInput(item.effectiveDate),
      sourceUrl: item.sourceUrl ?? '',
      sourceId: item.sourceId ?? '',
      isLatest: item.isLatest,
      accessLevel: item.accessLevel,
      sections: item.sections.length > 0
        ? item.sections.map((section, index) => ({
            ...section,
            order: section.order ?? index,
            authorName: section.authorName ?? '',
            reviewedAt: section.reviewedAt ? toDateInput(section.reviewedAt) : null,
          }))
        : createDefaultSections(),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setSection = <K extends keyof LegalDocumentAdminSectionItem>(
    index: number,
    key: K,
    value: LegalDocumentAdminSectionItem[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [key]: value } : section,
      ),
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 본문은 필수입니다.')
      return
    }

    setError('')
    startTransition(async () => {
      const isEdit = !!editingId
      const payload = {
        ...form,
        sections: form.sections
          .filter((section) => section.content.trim().length > 0)
          .map((section, index) => ({
            ...section,
            order: index,
            authorName: section.authorName?.trim() || undefined,
            reviewedAt: section.reviewedAt || undefined,
          })),
      }
      const res = await fetch(
        isEdit ? `/api/admin/legal-documents/${editingId}` : '/api/admin/legal-documents',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? '저장에 실패했습니다.')
        return
      }

      const data = await res.json()
      const saved = data.document as LegalDocumentAdminItem
      setItems((prev) =>
        isEdit
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev],
      )
      resetForm()
      router.refresh()
    })
  }

  const handleDelete = (item: LegalDocumentAdminItem) => {
    if (!confirm(`"${item.title}" 문서를 삭제하시겠습니까?`)) return

    startTransition(async () => {
      const res = await fetch(`/api/admin/legal-documents/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert((data as { error?: string }).error ?? '삭제에 실패했습니다.')
        return
      }
      setItems((prev) => prev.filter((doc) => doc.id !== item.id))
      if (editingId === item.id) resetForm()
      router.refresh()
    })
  }

  return (
    <div>
      {!formOpen && (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] transition-colors"
        >
          새 법령 문서 등록
        </button>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                {editing ? '법령 문서 수정' : '새 법령 문서 등록'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                본문은 마크다운 형식으로 작성합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-xs text-gray-500 mb-1">원문 링크</label>
              <input
                type="url"
                value={form.sourceUrl}
                onChange={(e) => set('sourceUrl', e.target.value)}
                placeholder="https://www.law.go.kr/..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">API 법령 ID</label>
              <input
                type="text"
                value={form.sourceId}
                onChange={(e) => set('sourceId', e.target.value)}
                placeholder="국가법령정보센터 법령ID"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">실무자용 요약</label>
            <textarea
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] resize-y"
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">기본 공개 본문 *</label>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={14}
              placeholder="## 주요 내용&#10;&#10;- 핵심 조항&#10;- 현장 적용 포인트"
              className="w-full font-mono text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] resize-y"
              disabled={isPending}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-900">콘텐츠 섹션</p>
              <p className="mt-1 text-xs text-gray-400">
                공개 요약, 원문 링크, 회원용 실무 해설, 정회원 전문 자료를 분리해 관리합니다.
              </p>
            </div>
            <div className="space-y-5">
              {form.sections.map((section, index) => {
                const meta = LEGAL_SECTION_META[section.type]
                return (
                  <section key={section.type} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          {meta.label}
                        </label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => setSection(index, 'title', e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                          disabled={isPending}
                        />
                        <p className="mt-1 text-xs text-gray-400">{meta.description}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">섹션 등급</label>
                        <select
                          value={section.accessLevel}
                          onChange={(e) => setSection(index, 'accessLevel', e.target.value as AccessLevel)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                          disabled={isPending}
                        >
                          <option value="PUBLIC">공개</option>
                          <option value="MEMBER">회원</option>
                          <option value="PREMIUM">정회원</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">검토일</label>
                        <input
                          type="date"
                          value={section.reviewedAt ?? ''}
                          onChange={(e) => setSection(index, 'reviewedAt', e.target.value || null)}
                          className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">섹션 본문</label>
                        <textarea
                          value={section.content}
                          onChange={(e) => setSection(index, 'content', e.target.value)}
                          rows={6}
                          className="w-full font-mono text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] resize-y"
                          disabled={isPending}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">작성자</label>
                        <input
                          type="text"
                          value={section.authorName ?? ''}
                          onChange={(e) => setSection(index, 'authorName', e.target.value)}
                          placeholder="KIMA, 변호사 등"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                          disabled={isPending}
                        />
                      </div>
                    </div>
                  </section>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as LegalCategory)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                disabled={isPending}
              >
                {LEGAL_CATEGORY_ORDER.map((category) => (
                  <option key={category} value={category}>
                    {LEGAL_CATEGORY_META[category].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">법령 유형</label>
              <select
                value={form.lawType}
                onChange={(e) => set('lawType', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                disabled={isPending}
              >
                <option value="">선택 안 함</option>
                {LAW_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">시행일</label>
              <input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => set('effectiveDate', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">접근 등급</label>
              <select
                value={form.accessLevel}
                onChange={(e) => set('accessLevel', e.target.value as AccessLevel)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                disabled={isPending}
              >
                <option value="PUBLIC">공개</option>
                <option value="MEMBER">회원</option>
                <option value="PREMIUM">정회원</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={form.isLatest}
              onChange={(e) => set('isLatest', e.target.checked)}
              className="rounded border-gray-300 text-[#1B3A6B] focus:ring-[#1B3A6B]"
              disabled={isPending}
            />
            최신 버전으로 표시
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
            >
              {isPending ? '저장 중...' : editing ? '수정 완료' : '등록'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <label htmlFor="legal-admin-search" className="sr-only">
            법령 문서 검색
          </label>
          <input
            id="legal-admin-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 요약, 카테고리, API 법령 ID 검색"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-400">표시할 법령 문서가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
                  <th className="px-4 py-3 text-left">제목</th>
                  <th className="px-4 py-3 text-left">분류</th>
                  <th className="px-4 py-3 text-left">등급</th>
                  <th className="px-4 py-3 text-left">시행일</th>
                  <th className="px-4 py-3 text-left">조회</th>
                  <th className="px-4 py-3 text-left">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => {
                  const category = LEGAL_CATEGORY_META[item.category]
                  const access = ACCESS_LEVEL_META[item.accessLevel]
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 max-w-sm">
                        <Link
                          href={`/legal/${item.id}`}
                          target="_blank"
                          className="font-medium text-gray-900 hover:text-[#1B3A6B] hover:underline line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                          {item.lawType && <span>{item.lawType}</span>}
                          {item.sourceId && <span>API {item.sourceId}</span>}
                          {item.isLatest ? <span>최신</span> : <span>이전 버전</span>}
                          <span>수정 {formatLegalDate(item.updatedAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-block px-2 py-0.5 rounded-full border text-xs font-medium', category.className)}>
                          {category.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-block px-2 py-0.5 rounded-full border text-xs font-medium', access.className)}>
                          {access.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatLegalDate(item.effectiveDate) ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {item.viewCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            disabled={isPending}
                            className="text-xs px-2.5 py-1 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
