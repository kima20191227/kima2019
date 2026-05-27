'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export interface NewsItem {
  id: string
  title: string
  content: string
  excerpt: string | null
  linkUrl: string | null
  source: string | null
  publishedAt: string | null
  authorId: string | null
}

interface FormState {
  title: string
  content: string
  excerpt: string
  linkUrl: string
  source: string
  publishedAt: string
}

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
  excerpt: '',
  linkUrl: '',
  source: '',
  publishedAt: '',
}

function toFormState(item: NewsItem): FormState {
  return {
    title: item.title,
    content: item.content,
    excerpt: item.excerpt ?? '',
    linkUrl: item.linkUrl ?? '',
    source: item.source ?? '',
    publishedAt: item.publishedAt
      ? new Date(item.publishedAt).toISOString().slice(0, 10)
      : '',
  }
}

interface NewsFormProps {
  editing: NewsItem | null
  onSubmit: (fields: FormState) => void
  onCancel: () => void
  isPending: boolean
  error: string
}

function NewsForm({ editing, onSubmit, onCancel, isPending, error }: NewsFormProps) {
  const [fields, setFields] = useState<FormState>(() =>
    editing ? toFormState(editing) : EMPTY_FORM,
  )
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setFields((p) => ({ ...p, [k]: v }))

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
      <h3 className="font-semibold text-gray-800 text-base">
        {editing ? '뉴스 수정' : '새 뉴스 등록'}
      </h3>

      {/* 제목 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">제목 *</label>
        <input
          type="text"
          value={fields.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="뉴스 제목"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          disabled={isPending}
        />
      </div>

      {/* 출처 + 기사 날짜 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">출처 (언론사)</label>
          <input
            type="text"
            value={fields.source}
            onChange={(e) => set('source', e.target.value)}
            placeholder="예: CBS, 국민일보"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">기사 날짜</label>
          <input
            type="date"
            value={fields.publishedAt}
            onChange={(e) => set('publishedAt', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          />
        </div>
      </div>

      {/* 기사 URL */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">기사 URL</label>
        <input
          type="url"
          value={fields.linkUrl}
          onChange={(e) => set('linkUrl', e.target.value)}
          placeholder="https://..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          disabled={isPending}
        />
      </div>

      {/* 요약 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">요약</label>
        <input
          type="text"
          value={fields.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          placeholder="뉴스 한 줄 요약 (목록에 표시)"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          disabled={isPending}
        />
      </div>

      {/* 내용 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">내용 *</label>
        <textarea
          value={fields.content}
          onChange={(e) => set('content', e.target.value)}
          rows={5}
          placeholder="뉴스 내용 또는 소개 글을 입력해주세요"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] resize-none"
          disabled={isPending}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(fields)}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {isPending ? (editing ? '수정 중…' : '등록 중…') : editing ? '수정 완료' : '등록'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}

interface Props {
  news: NewsItem[]
  isOfficer: boolean
  currentUserId?: string
}

export function NewsPageClient({ news, isOfficer, currentUserId }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')

  const isFormVisible = formOpen || editing !== null

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
    setFormError('')
  }

  const handleSubmit = (fields: FormState) => {
    if (!fields.title.trim()) { setFormError('제목을 입력해주세요.'); return }
    if (!fields.content.trim()) { setFormError('내용을 입력해주세요.'); return }
    setFormError('')

    startTransition(async () => {
      const isEdit = editing !== null
      const url = isEdit ? `/api/stories/${editing.id}` : '/api/stories'
      const method = isEdit ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        title: fields.title.trim(),
        content: fields.content.trim(),
        ...(fields.excerpt.trim() ? { excerpt: fields.excerpt.trim() } : { excerpt: null }),
        ...(fields.linkUrl.trim() ? { linkUrl: fields.linkUrl.trim() } : { linkUrl: null }),
        ...(fields.source.trim() ? { source: fields.source.trim() } : { source: null }),
        ...(fields.publishedAt
          ? { publishedAt: new Date(fields.publishedAt).toISOString() }
          : { publishedAt: null }),
      }

      if (!isEdit) body.type = 'NEWS'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFormError((json as { error?: string }).error ?? '처리에 실패했습니다.')
        return
      }

      closeForm()
      router.refresh()
    })
  }

  const handleDelete = (item: NewsItem) => {
    if (!confirm(`"${item.title}" 뉴스를 삭제하시겠습니까?`)) return
    startTransition(async () => {
      const res = await fetch(`/api/stories/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert((json as { error?: string }).error ?? '삭제에 실패했습니다.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* 등록 버튼 */}
      {isOfficer && !isFormVisible && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            뉴스 등록
          </button>
        </div>
      )}

      {/* 등록/수정 폼 */}
      {isFormVisible && (
        <NewsForm
          key={editing?.id ?? 'new'}
          editing={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isPending={isPending}
          error={formError}
        />
      )}

      {/* 뉴스 목록 */}
      {news.length === 0 ? (
        <p className="text-center text-gray-400 py-20">등록된 뉴스가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {news.map((item) => {
            const canManage = isOfficer || item.authorId === currentUserId
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group relative"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {item.source && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          {item.source}
                        </span>
                      )}
                      {item.publishedAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(item.publishedAt).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-[#1B3A6B] transition-colors">
                      {item.title}
                    </h3>
                    {item.excerpt && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B3A6B] text-sm font-medium whitespace-nowrap hover:underline"
                      >
                        기사 보기 →
                      </a>
                    )}

                    {canManage && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => { setEditing(item); setFormOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                          disabled={isPending}
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#1B3A6B] hover:bg-blue-50 transition-colors disabled:opacity-50"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={isPending}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
