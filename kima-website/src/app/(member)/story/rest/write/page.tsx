'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnEditor } from '@/components/column/ColumnEditor'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

export default function RestWalkWritePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    authorName: '',
    ministryLocation: '',
    videoUrls: '',
    tags: '',
  })
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleContentChange = useCallback((html: string) => {
    setForm((prev) => ({ ...prev, content: html }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim() || form.content === '<p></p>') {
      setError('본문을 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const images = attachments.filter((a) => a.type.startsWith('image/')).map((a) => a.url)
      const firstImage = attachments.find((a) => a.type.startsWith('image/'))
      const thumbnail = firstImage?.url ?? null

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REST_WALK',
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          authorName: form.authorName || null,
          ministryLocation: form.ministryLocation || null,
          thumbnail,
          images,
          attachments,
          videoUrls: form.videoUrls.split('\n').map((v) => v.trim()).filter(Boolean),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '서버 오류')
      }
      router.push('/story/rest')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-2">쉬어가는 발걸음 — 글 올리기</h1>
        <p className="text-sm text-gray-500 mb-8">사역의 길 위에서 나누고 싶은 이야기를 자유롭게 올려주세요.</p>

        {/* 안내 */}
        <div className="bg-green-50 rounded-xl p-4 mb-6 text-sm leading-relaxed">
          <p className="font-semibold text-green-800 mb-1">작성 안내</p>
          <ul className="list-disc list-inside space-y-1 text-green-700">
            <li>묵상, 여행, 음악, 책, 일상 등 사역자의 쉼이 되는 이야기라면 무엇이든 좋습니다.</li>
            <li>실명 공개가 부담스러우면 이니셜이나 닉네임을 사용하셔도 됩니다.</li>
            <li>타인의 저작물(사진·글)을 인용할 경우 출처를 명시해 주세요.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="글 제목을 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

          {/* 한줄 요약 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">한줄 요약 (선택)</label>
            <input
              maxLength={200}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="목록에 표시될 짧은 설명"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

          {/* 본문 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
            <ColumnEditor
              content={form.content}
              onChange={handleContentChange}
              placeholder="이야기를 자유롭게 써주세요. 굵게·글자색·크기·정렬 등을 활용해 보세요."
            />
          </div>

          {/* 작성자 / 사역지 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작성자 이름 (선택)</label>
              <input
                maxLength={50}
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="실명·이니셜·익명 가능"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소속·사역지 (선택)</label>
              <input
                maxLength={100}
                value={form.ministryLocation}
                onChange={(e) => setForm({ ...form, ministryLocation: e.target.value })}
                placeholder="예: 서울, A교회"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              />
            </div>
          </div>

          {/* 유튜브 / 영상 링크 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">영상 링크 (선택, 여러 개는 줄바꿈)</label>
            <textarea
              rows={3}
              value={form.videoUrls}
              onChange={(e) => setForm({ ...form, videoUrls: e.target.value })}
              placeholder="유튜브·Vimeo 링크를 한 줄씩 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">입력한 영상은 게시글 내에서 바로 시청할 수 있습니다.</p>
          </div>

          {/* 사진·자료 첨부 */}
          <div>
            <FileAttachmentZone
              label="사진·자료 첨부 (선택) — 이미지·PDF·문서"
              initialFiles={attachments}
              onChange={(files, uploading) => {
                setAttachments(files)
                setIsUploading(uploading)
              }}
            />
            <p className="text-xs text-gray-400 mt-1.5">첫 번째 이미지가 썸네일로 사용됩니다.</p>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">태그 (선택, 쉼표로 구분)</label>
            <input
              maxLength={200}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="예: 묵상, 여행, 음악"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
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
              className="flex-1 py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50 text-sm"
            >
              {isUploading ? '업로드 중...' : submitting ? '올리는 중...' : '올리기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
