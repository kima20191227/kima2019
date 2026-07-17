'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

export function MediaWriteForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    eventLocation: '',
    eventDate: '',
    videoUrls: '',
    tags: '',
  })
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
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
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EVENT_MEDIA',
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
      router.push('/story/media')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">행사명 *</label>
        <input
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="예: KIMA 4기 이취임식 감사예배 및 임시총회"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 한줄 요약 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">한줄 설명 (선택)</label>
        <input
          maxLength={200}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          placeholder="목록에 표시될 짧은 설명"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
        />
      </div>

      {/* 행사 일시·장소 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">행사 일시 (선택)</label>
          <input
            type="date"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">행사 장소 (선택)</label>
          <input
            maxLength={100}
            value={form.eventLocation}
            onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
            placeholder="예: 영락교회 봉사관 505호"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
        </div>
      </div>

      {/* 본문 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">행사 내용 (선택)</label>
        <textarea
          rows={5}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="행사 내용, 참여자, 특이사항 등을 자유롭게 기록하세요."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
        />
      </div>

      {/* 사진·자료 첨부 */}
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

      {/* 동영상 링크 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          동영상 링크 <span className="text-gray-400 font-normal">(선택, 여러 개는 줄바꿈)</span>
        </label>
        <textarea
          rows={3}
          value={form.videoUrls}
          onChange={(e) => setForm({ ...form, videoUrls: e.target.value })}
          placeholder="유튜브·Vimeo 링크를 한 줄씩 입력하세요"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none font-mono"
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          태그 <span className="text-gray-400 font-normal">(선택, 쉼표로 구분)</span>
        </label>
        <input
          maxLength={200}
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="예: 이주민, kima, 총회"
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
          {isUploading ? '사진 업로드 중...' : submitting ? '등록 중...' : '갤러리 등록하기'}
        </button>
      </div>
    </form>
  )
}
