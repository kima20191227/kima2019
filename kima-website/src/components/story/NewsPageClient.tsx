'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { convertDriveUrl } from '@/lib/utils'
import { uploadResourceFile } from '@/lib/uploadClient'

export interface NewsItem {
  id: string
  title: string
  content: string
  excerpt: string | null
  linkUrl: string | null
  source: string | null
  publishedAt: string | null
  authorId: string | null
  thumbnail: string | null
  videoUrls: string[]
}

function getYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function getThumb(item: NewsItem): string | null {
  if (item.thumbnail) return convertDriveUrl(item.thumbnail)
  if (item.videoUrls.length > 0) {
    const id = getYoutubeId(item.videoUrls[0])
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  }
  return null
}

interface FormState {
  title: string
  content: string
  excerpt: string
  linkUrl: string
  source: string
  publishedAt: string
  thumbnail: string
  youtubeUrl: string
}

const EMPTY_FORM: FormState = {
  title: '', content: '', excerpt: '', linkUrl: '',
  source: '', publishedAt: '', thumbnail: '', youtubeUrl: '',
}

function toFormState(item: NewsItem): FormState {
  return {
    title: item.title,
    content: item.content,
    excerpt: item.excerpt ?? '',
    linkUrl: item.linkUrl ?? '',
    source: item.source ?? '',
    publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : '',
    thumbnail: item.thumbnail ?? '',
    youtubeUrl: item.videoUrls[0] ?? '',
  }
}

function NewsForm({ editing, onSubmit, onCancel, isPending, error }: {
  editing: NewsItem | null
  onSubmit: (fields: FormState) => void
  onCancel: () => void
  isPending: boolean
  error: string
}) {
  const [fields, setFields] = useState<FormState>(() =>
    editing ? toFormState(editing) : EMPTY_FORM,
  )
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  const [thumbnailError, setThumbnailError] = useState('')
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setFields((p) => ({ ...p, [k]: v }))

  const ytId = fields.youtubeUrl ? getYoutubeId(fields.youtubeUrl) : null
  const thumbPreview = localPreview
    || (fields.thumbnail ? convertDriveUrl(fields.thumbnail) : '')
    || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  const inp = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]'

  const handleThumbnailFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setThumbnailError('이미지 파일만 선택할 수 있습니다.')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)
    setThumbnailUploading(true)
    setThumbnailError('')

    try {
      const uploaded = await uploadResourceFile(file)
      set('thumbnail', uploaded.url)
    } catch (err) {
      setThumbnailError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.')
    } finally {
      setThumbnailUploading(false)
      setLocalPreview(null)
      URL.revokeObjectURL(previewUrl)
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#1B3A6B]/20 shadow-sm p-6 mb-6 space-y-4">
      <h3 className="font-semibold text-[#1B3A6B] text-base">
        {editing ? '✎ 뉴스 수정' : '+ 새 뉴스 등록'}
      </h3>

      <div>
        <label className="block text-xs text-gray-500 mb-1">제목 *</label>
        <input type="text" value={fields.title} onChange={(e) => set('title', e.target.value)}
          placeholder="뉴스 제목" className={inp} disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">출처 (언론사)</label>
          <input type="text" value={fields.source} onChange={(e) => set('source', e.target.value)}
            placeholder="예: CBS, 국민일보" className={inp} disabled={isPending} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">기사 날짜</label>
          <input type="date" value={fields.publishedAt} onChange={(e) => set('publishedAt', e.target.value)}
            title="기사 날짜" className={inp} disabled={isPending} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">기사 원문 URL</label>
        <input type="url" value={fields.linkUrl} onChange={(e) => set('linkUrl', e.target.value)}
          placeholder="https://..." className={inp} disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">썸네일 이미지 URL (선택)</label>
          <input type="url" value={fields.thumbnail} onChange={(e) => set('thumbnail', e.target.value)}
            placeholder="https://example.com/image.jpg" className={inp} disabled={isPending || thumbnailUploading} />
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="썸네일 이미지 파일 선택"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleThumbnailFile(file)
              }}
            />
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isPending || thumbnailUploading}
              className="px-3 py-1.5 rounded-lg border border-[#1B3A6B]/30 text-[#1B3A6B] text-xs font-medium hover:bg-[#1B3A6B]/5 disabled:opacity-50 transition-colors"
            >
              {thumbnailUploading ? '업로드 중...' : '로컬 이미지 선택'}
            </button>
            {fields.thumbnail && (
              <button
                type="button"
                onClick={() => {
                  set('thumbnail', '')
                  setThumbnailError('')
                }}
                disabled={isPending || thumbnailUploading}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                이미지 제거
              </button>
            )}
          </div>
          {thumbnailError && <p className="text-xs text-red-500 mt-1">{thumbnailError}</p>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">유튜브 URL (선택 — 자동 썸네일)</label>
          <input type="url" value={fields.youtubeUrl} onChange={(e) => set('youtubeUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=..." className={inp} disabled={isPending} />
        </div>
      </div>

      {thumbPreview && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbPreview} alt="썸네일 미리보기" className="w-32 h-20 object-cover rounded-lg border border-gray-200" />
          <p className="text-xs text-gray-400">썸네일 미리보기</p>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">요약 (목록에 표시)</label>
        <input type="text" value={fields.excerpt} onChange={(e) => set('excerpt', e.target.value)}
          placeholder="뉴스 한 줄 요약" className={inp} disabled={isPending} />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">내용 *</label>
        <textarea value={fields.content} onChange={(e) => set('content', e.target.value)}
          rows={4} placeholder="뉴스 내용 또는 소개 글"
          className={`${inp} resize-none`} disabled={isPending} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => onSubmit(fields)} disabled={isPending || thumbnailUploading}
          className="px-5 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors">
          {thumbnailUploading ? '이미지 업로드 중…' : isPending ? (editing ? '수정 중…' : '등록 중…') : editing ? '수정 완료' : '등록'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
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

export function NewsPageClient({ news, isOfficer }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen]   = useState(false)
  const [editing, setEditing]     = useState<NewsItem | null>(null)
  const [isPending, startTrans]   = useTransition()
  const [formError, setFormError] = useState('')

  const isFormVisible = formOpen || editing !== null

  const closeForm = () => { setFormOpen(false); setEditing(null); setFormError('') }

  const handleSubmit = (fields: FormState) => {
    if (!fields.title.trim())   { setFormError('제목을 입력해주세요.');  return }
    if (!fields.content.trim()) { setFormError('내용을 입력해주세요.'); return }
    setFormError('')

    startTrans(async () => {
      const isEdit = editing !== null
      const url    = isEdit ? `/api/stories/${editing.id}` : '/api/stories'
      const method = isEdit ? 'PATCH' : 'POST'

      const ytId = fields.youtubeUrl ? getYoutubeId(fields.youtubeUrl) : null

      const body: Record<string, unknown> = {
        title:      fields.title.trim(),
        content:    fields.content.trim(),
        excerpt:    fields.excerpt.trim()    || null,
        linkUrl:    fields.linkUrl.trim()    || null,
        source:     fields.source.trim()     || null,
        publishedAt: fields.publishedAt ? new Date(fields.publishedAt).toISOString() : null,
        thumbnail:  fields.thumbnail.trim()  || null,
        videoUrls:  ytId ? [`https://www.youtube.com/watch?v=${ytId}`] : [],
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
    startTrans(async () => {
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

      {/* 상단 툴바 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">총 {news.length}건</p>
        {isOfficer && !isFormVisible && (
          <button type="button" onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            뉴스 등록
          </button>
        )}
      </div>

      {/* 등록/수정 폼 */}
      {isFormVisible && (
        <NewsForm key={editing?.id ?? 'new'} editing={editing}
          onSubmit={handleSubmit} onCancel={closeForm}
          isPending={isPending} error={formError} />
      )}

      {/* 게시판 */}
      {news.length === 0 ? (
        <p className="text-center text-gray-400 py-20">등록된 뉴스가 없습니다.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* 헤더 (데스크탑) */}
          <div className="hidden md:grid grid-cols-[2.5rem_1fr_5rem_5.5rem_auto] items-center gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100
                          text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span className="text-center">No.</span>
            <span>제목</span>
            <span className="text-center">출처</span>
            <span className="text-center">날짜</span>
            <span />
          </div>

          {/* 행 */}
          {news.map((item, idx) => {
            const thumb   = getThumb(item)
            const dateStr = item.publishedAt
              ? new Date(item.publishedAt).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })
              : '—'

            return (
              <div key={item.id}
                className="grid items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0
                           hover:bg-blue-50/30 transition-colors
                           md:grid-cols-[2.5rem_1fr_5rem_5.5rem_auto]
                           grid-cols-[1fr_auto]">

                {/* 번호 (데스크탑) */}
                <span className="hidden md:block text-center text-xs text-gray-400">
                  {news.length - idx}
                </span>

                {/* 제목 + 썸네일 */}
                <div className="flex items-center gap-3 min-w-0">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="hidden sm:block shrink-0 w-16 h-11 rounded-md object-cover bg-gray-100" />
                  ) : (
                    <div className="hidden sm:block shrink-0 w-16 h-11 rounded-md bg-gray-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link href={`/story/${item.id}`}
                      className="text-sm font-semibold text-gray-800 hover:text-[#1B3A6B] line-clamp-1 transition-colors">
                      {item.title}
                    </Link>
                    {item.excerpt && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.excerpt}</p>
                    )}
                    {/* 모바일 메타 */}
                    <div className="flex items-center gap-2 mt-0.5 md:hidden">
                      {item.source && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                          {item.source}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{dateStr}</span>
                    </div>
                  </div>
                </div>

                {/* 출처 (데스크탑) */}
                <div className="hidden md:flex justify-center">
                  {item.source
                    ? <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium truncate max-w-[4.5rem]">{item.source}</span>
                    : <span className="text-xs text-gray-300">—</span>}
                </div>

                {/* 날짜 (데스크탑) */}
                <span className="hidden md:block text-center text-xs text-gray-400">{dateStr}</span>

                {/* 액션 */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.linkUrl && (
                    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md bg-[#1B3A6B] text-white text-xs font-medium hover:bg-[#15305a] transition-colors whitespace-nowrap">
                      기사 보기 →
                    </a>
                  )}
                  {isOfficer && (
                    <>
                      <button type="button"
                        onClick={() => { setEditing(item); setFormOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        disabled={isPending}
                        title="수정"
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#1B3A6B] hover:bg-blue-50 transition-colors disabled:opacity-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => handleDelete(item)}
                        disabled={isPending}
                        title="삭제"
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
