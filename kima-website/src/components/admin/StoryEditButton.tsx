'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type StoryType = 'NOTICE' | 'NEWS' | 'FIELD_STORY' | 'EVENT_MEDIA' | 'EVENT_PROMO' | 'PRAYER_REQUEST' | 'REST_WALK'

const TYPE_LABELS: Record<StoryType, string> = {
  NOTICE:         '📢 공지사항',
  NEWS:           '📰 KIMA 보도자료',
  EVENT_MEDIA:    '📸 KIMA 행사&영상',
  FIELD_STORY:    '✍️ 사역현장 이야기',
  EVENT_PROMO:    '📣 이주민 사역안내',
  PRAYER_REQUEST: '🙏 중보기도 요청',
  REST_WALK:      '🌿 쉬어가는 발걸음',
}

interface StoryEditProps {
  story: {
    id: string
    type: StoryType
    title: string
    content: string
    excerpt: string | null
    linkUrl: string | null
    source: string | null
    publishedAt: Date | null
    eventLocation: string | null
    ministryLocation: string | null
    videoUrls: string[]
    tags: string[]
    isPublished: boolean
  }
}

export function StoryEditButton({ story }: StoryEditProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    type:             story.type,
    title:            story.title,
    content:          story.content,
    excerpt:          story.excerpt ?? '',
    linkUrl:          story.linkUrl ?? '',
    source:           story.source ?? '',
    publishedAt:      story.publishedAt
      ? new Date(story.publishedAt).toISOString().split('T')[0]
      : '',
    eventLocation:    story.eventLocation ?? '',
    ministryLocation: story.ministryLocation ?? '',
    videoUrls:        story.videoUrls.join('\n'),
    tags:             story.tags.join(', '),
    isPublished:      story.isPublished,
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = () => {
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!form.content.trim()) { setError('내용을 입력해주세요.'); return }
    setError('')

    startTransition(async () => {
      try {
        const res = await fetch(`/api/stories/${story.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type:             form.type,
            title:            form.title.trim(),
            content:          form.content.trim(),
            excerpt:          form.excerpt.trim() || null,
            linkUrl:          form.linkUrl.trim() || null,
            source:           form.source.trim() || null,
            publishedAt:      form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
            eventLocation:    form.eventLocation.trim() || null,
            ministryLocation: form.ministryLocation.trim() || null,
            videoUrls:        form.videoUrls.split('\n').map((v) => v.trim()).filter(Boolean),
            tags:             form.tags.split(',').map((t) => t.trim()).filter(Boolean),
            isPublished:      form.isPublished,
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? '수정에 실패했습니다.')
          return
        }
        setOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.')
      }
    })
  }

  const ic = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] disabled:opacity-60'

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
      >
        수정
      </button>
    )
  }

  return (
    <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">스토리 수정</h4>

      {/* 카테고리 변경 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">카테고리</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(TYPE_LABELS) as StoryType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              disabled={isPending}
              className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                form.type === t
                  ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        {form.type !== story.type && (
          <p className="text-xs text-amber-600 mt-1.5">
            ⚠️ 카테고리를 <strong>{TYPE_LABELS[story.type]}</strong>에서 <strong>{TYPE_LABELS[form.type]}</strong>으로 변경합니다.
          </p>
        )}
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">제목 *</label>
        <input type="text" title="제목" value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className={ic} disabled={isPending} />
      </div>

      {/* NEWS 전용 */}
      {form.type === 'NEWS' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">뉴스 링크 URL</label>
            <input type="text" title="뉴스 링크 URL" value={form.linkUrl}
              onChange={(e) => set('linkUrl', e.target.value)}
              placeholder="https://..." className={ic} disabled={isPending} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">출처</label>
              <input type="text" title="출처" value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className={ic} disabled={isPending} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">발행일</label>
              <input type="date" title="발행일" value={form.publishedAt}
                onChange={(e) => set('publishedAt', e.target.value)}
                className={ic} disabled={isPending} />
            </div>
          </div>
        </>
      )}

      {/* EVENT_MEDIA 전용 */}
      {form.type === 'EVENT_MEDIA' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">행사 날짜</label>
            <input type="date" title="행사 날짜" value={form.publishedAt}
              onChange={(e) => set('publishedAt', e.target.value)}
              className={ic} disabled={isPending} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">장소</label>
            <input type="text" title="장소" value={form.eventLocation}
              onChange={(e) => set('eventLocation', e.target.value)}
              className={ic} disabled={isPending} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">동영상 링크 (줄바꿈으로 구분)</label>
            <textarea title="동영상 링크" value={form.videoUrls}
              onChange={(e) => set('videoUrls', e.target.value)}
              rows={2} className={`${ic} resize-none`} disabled={isPending} />
          </div>
        </>
      )}

      {/* FIELD_STORY 전용 */}
      {form.type === 'FIELD_STORY' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">사역 지역/단체</label>
          <input type="text" title="사역 지역/단체" value={form.ministryLocation}
            onChange={(e) => set('ministryLocation', e.target.value)}
            className={ic} disabled={isPending} />
        </div>
      )}

      {/* EVENT_PROMO 전용 */}
      {form.type === 'EVENT_PROMO' && (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">행사 장소</label>
            <input type="text" title="행사 장소" value={form.eventLocation}
              onChange={(e) => set('eventLocation', e.target.value)}
              className={ic} disabled={isPending} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">동영상 링크 (줄바꿈으로 구분)</label>
            <textarea title="동영상 링크" value={form.videoUrls}
              onChange={(e) => set('videoUrls', e.target.value)}
              rows={2} className={`${ic} resize-none`} disabled={isPending} />
          </div>
        </>
      )}

      {/* 내용 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">내용 *</label>
        <textarea title="내용" value={form.content}
          onChange={(e) => set('content', e.target.value)}
          rows={5} className={`${ic} resize-y`} disabled={isPending} />
      </div>

      {/* 한줄 요약 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">한줄 요약</label>
        <input type="text" title="한줄 요약" value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          className={ic} disabled={isPending} />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">태그 (쉼표로 구분)</label>
        <input type="text" title="태그" value={form.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="예: 이주민, 선교, 2024" className={ic} disabled={isPending} />
      </div>

      {/* 공개 여부 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isPublished}
          onChange={(e) => set('isPublished', e.target.checked)} disabled={isPending} />
        <span className="text-xs text-gray-600">공개</span>
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={handleSubmit} disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors">
          {isPending ? '저장 중…' : '저장'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setError('') }} disabled={isPending}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
          취소
        </button>
      </div>
    </div>
  )
}
