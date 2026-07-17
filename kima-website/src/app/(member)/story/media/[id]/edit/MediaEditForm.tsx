'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

interface MediaStory {
  id: string
  title: string
  content: string
  excerpt: string | null
  eventLocation: string | null
  publishedAt: Date | null
  thumbnail: string | null
  images: string[]
  videoUrls: string[]
  tags: string[]
  attachments?: { url: string; name: string; type: string; isCover?: boolean }[] | null
}

interface Props {
  story: MediaStory
}

function buildInitialFiles(story: MediaStory): AttachedFile[] {
  if (story.attachments && story.attachments.length > 0) {
    return story.attachments.map((a) => ({ url: a.url, name: a.name, type: a.type, isCover: a.isCover }))
  }
  // 구 데이터: attachments 없이 images만 있는 글은 thumbnail로 대표를 복원한다.
  return story.images.map((url, i) => ({
    url,
    name: url.split('/').pop() ?? `image-${i}`,
    type: 'image/*',
    isCover: story.thumbnail ? url === story.thumbnail : undefined,
  }))
}

export function MediaEditForm({ story }: Props) {
  const router = useRouter()

  const initialDate = story.publishedAt
    ? new Date(story.publishedAt).toISOString().slice(0, 10)
    : ''

  const [form, setForm] = useState({
    title: story.title,
    content: story.content,
    excerpt: story.excerpt ?? '',
    eventLocation: story.eventLocation ?? '',
    eventDate: initialDate,
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
          eventLocation: form.eventLocation || null,
          publishedAt: form.eventDate ? new Date(form.eventDate).toISOString() : null,
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
      router.push(`/story/media/${story.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">행사명 *</label>
        <input
          id="edit-title"
          required
          maxLength={200}
          placeholder="행사명을 입력하세요"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      <div>
        <label htmlFor="edit-excerpt" className="block text-sm font-medium text-gray-700 mb-1">한줄 설명 (선택)</label>
        <input
          id="edit-excerpt"
          maxLength={200}
          placeholder="목록에 표시될 짧은 설명"
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-eventDate" className="block text-sm font-medium text-gray-700 mb-1">행사 일시 (선택)</label>
          <input
            id="edit-eventDate"
            type="date"
            title="행사 일시"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
        </div>
        <div>
          <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">행사 장소 (선택)</label>
          <input
            id="edit-location"
            maxLength={100}
            placeholder="예: 영락교회 봉사관 505호"
            value={form.eventLocation}
            onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">행사 내용 (선택)</label>
        <textarea
          id="edit-content"
          rows={5}
          placeholder="행사 내용, 참여자, 특이사항 등을 자유롭게 기록하세요."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
        />
      </div>

      <div>
        <FileAttachmentZone
          label="행사 사진·자료 첨부 — 이미지·PDF·문서"
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

      <div>
        <label htmlFor="edit-videoUrls" className="block text-sm font-medium text-gray-700 mb-1">
          동영상 링크 <span className="text-gray-400 font-normal">(선택, 여러 개는 줄바꿈)</span>
        </label>
        <textarea
          id="edit-videoUrls"
          rows={3}
          placeholder="유튜브·Vimeo 링크를 한 줄씩 입력하세요"
          value={form.videoUrls}
          onChange={(e) => setForm({ ...form, videoUrls: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none font-mono"
        />
      </div>

      <div>
        <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-1">
          태그 <span className="text-gray-400 font-normal">(선택, 쉼표로 구분)</span>
        </label>
        <input
          id="edit-tags"
          maxLength={200}
          placeholder="예: 이주민, kima, 총회"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || isUploading}
          className="flex-[2] py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50 text-sm"
        >
          {isUploading ? '사진 업로드 중...' : submitting ? '저장 중...' : '수정 완료'}
        </button>
      </div>
    </form>
  )
}
