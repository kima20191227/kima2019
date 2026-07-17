'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

interface StoryData {
  id: string
  title: string
  content: string
  excerpt: string | null
  thumbnail: string | null
  authorName: string | null
  eventLocation: string | null
  linkUrl: string | null
  images: string[]
  videoUrls: string[]
  tags: string[]
  attachments?: { url: string; name: string; type: string; isCover?: boolean }[] | null
}

function buildInitialFiles(story: StoryData): AttachedFile[] {
  if (story.attachments && story.attachments.length > 0) {
    return story.attachments.map((a) => ({ url: a.url, name: a.name, type: a.type, isCover: a.isCover }))
  }
  // 구 데이터: attachments 없이 images만 있는 글은 thumbnail로 대표를 복원한다.
  const all = story.images.length > 0 ? story.images : (story.thumbnail ? [story.thumbnail] : [])
  return all.map((url, idx) => ({
    url,
    name: `image-${idx + 1}`,
    type: 'image/*',
    isCover: story.thumbnail ? url === story.thumbnail : undefined,
  }))
}

export function EventPromoEditForm({ story }: { story: StoryData }) {
  const router = useRouter()

  const [form, setForm] = useState({
    title: story.title,
    content: story.content,
    excerpt: story.excerpt ?? '',
    authorName: story.authorName ?? '',
    eventLocation: story.eventLocation ?? '',
    websiteUrl: story.linkUrl ?? '',
    videoUrls: story.videoUrls.join('\n'),
    tags: story.tags.join(', '),
  })
  const [attachments, setAttachments] = useState<AttachedFile[]>(() => buildInitialFiles(story))
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const images = attachments.filter((a) => a.type.startsWith('image/')).map((a) => a.url)
    const coverImage = attachments.find((a) => a.isCover && a.type.startsWith('image/'))
    const thumbnail = coverImage?.url ?? images[0] ?? null
    const videoUrls = form.videoUrls.split('\n').map((v) => v.trim()).filter(Boolean)
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)

    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          authorName: form.authorName || null,
          eventLocation: form.eventLocation || null,
          linkUrl: form.websiteUrl || null,
          thumbnail,
          images,
          attachments,
          videoUrls,
          tags,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '서버 오류')
      }
      router.push(`/story/event-promo/${story.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]'

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">행사 제목 *</label>
        <input
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="예: 2025 이주민 선교 컨퍼런스"
          className={inputCls}
        />
      </div>

      {/* 한줄 요약 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">한줄 소개 (선택)</label>
        <input
          maxLength={200}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="목록에 표시될 짧은 설명"
          className={inputCls}
        />
      </div>

      {/* 본문 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">행사 내용 *</label>
        <textarea
          required
          rows={10}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="행사 일정, 장소, 내용, 참가 방법 등을 자세히 적어주세요."
          className={`${inputCls} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">주최·작성자 (선택)</label>
          <input
            maxLength={50}
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            placeholder="예: OO교회 선교팀"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">행사 장소 (선택)</label>
          <input
            maxLength={100}
            value={form.eventLocation}
            onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
            placeholder="예: 서울 강남구 OO교회"
            className={inputCls}
          />
        </div>
      </div>

      {/* 웹사이트 URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">웹페이지 주소 (선택)</label>
        <input
          type="url"
          maxLength={500}
          value={form.websiteUrl}
          onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
          placeholder="예: https://event.example.com"
          className={inputCls}
        />
        <p className="text-xs text-gray-400 mt-1">행사 공식 홈페이지, 신청 폼, SNS 링크 등을 입력하세요.</p>
      </div>

      {/* 사진·자료 첨부 */}
      <div>
        <FileAttachmentZone
          label="행사 사진·자료 첨부 (선택) — 이미지·PDF·문서"
          initialFiles={attachments}
          onChange={(files, uploading) => {
            setAttachments(files)
            setIsUploading(uploading)
          }}
        />
        <p className="text-xs text-gray-400 mt-1.5">
          첫 번째 이미지(또는 &apos;대표 설정&apos; 이미지)가 썸네일로 사용됩니다.
        </p>
      </div>

      {/* 동영상 링크 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">동영상 링크 (선택, 여러 개는 줄바꿈)</label>
        <textarea
          rows={3}
          value={form.videoUrls}
          onChange={(e) => setForm({ ...form, videoUrls: e.target.value })}
          placeholder="유튜브·Vimeo 링크를 한 줄씩 입력하세요"
          className={`${inputCls} resize-none font-mono`}
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">태그 (선택, 쉼표로 구분)</label>
        <input
          maxLength={200}
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="예: 컨퍼런스, 이주노동자, 서울"
          className={inputCls}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || isUploading}
          className="flex-1 py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50"
        >
          {isUploading ? '업로드 중...' : submitting ? '저장 중...' : '수정 완료'}
        </button>
      </div>
    </form>
  )
}
