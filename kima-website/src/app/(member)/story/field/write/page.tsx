'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoUploadZone } from '@/components/ui/PhotoUploadZone'
import type { PhotoAttachment } from '@/components/ui/PhotoUploadZone'
import { ColumnEditor } from '@/components/column/ColumnEditor'

export default function FieldStoryWritePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    authorName: '',
    ministryLocation: '',
    videoUrls: '',
    tags: '',
    agree: false,
  })
  const [storyImages, setStoryImages] = useState<PhotoAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleContentChange = useCallback((html: string) => {
    setForm((prev) => ({ ...prev, content: html }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.agree) { setError('사진·내용 관련 안내에 동의해 주세요.'); return }
    setSubmitting(true)
    setError('')
    try {
      const images = storyImages.map((a) => a.url)
      const coverImage = storyImages.find((a) => a.isCover)
      const thumbnail = coverImage?.url ?? images[0] ?? null

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'FIELD_STORY',
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          authorName: form.authorName || null,
          ministryLocation: form.ministryLocation || null,
          thumbnail,
          images,
          videoUrls: form.videoUrls.split('\n').map((v) => v.trim()).filter(Boolean),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          status: 'PENDING',
        }),
      })
      if (!res.ok) throw new Error('서버 오류')
      router.push('/story/field')
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-2">사역현장 이야기 올리기</h1>
        <p className="text-sm text-gray-500 mb-8">관리자 검토 후 게시됩니다.</p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm leading-relaxed">
          <p className="font-semibold text-blue-800 mb-1">작성 안내</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>이야기는 3단계로 나눠 써주세요: ① 상황/배경 ② 하나님께서 행하신 일 ③ 기도 부탁</li>
            <li>실명 공개가 부담스러우면 이니셜이나 지역명만 사용하셔도 됩니다.</li>
            <li>사진은 당사자 동의를 받고 올려주세요. 민감한 얼굴은 가급적 뒷모습·단체 사진을 활용해 주세요.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="이야기 제목을 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
            <ColumnEditor
              content={form.content}
              onChange={handleContentChange}
              placeholder="현장 이야기를 자유롭게 써주세요. 굵게·글자색·크기 등을 활용할 수 있습니다."
            />
          </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">사역지 (선택)</label>
              <input
                maxLength={100}
                value={form.ministryLocation}
                onChange={(e) => setForm({ ...form, ministryLocation: e.target.value })}
                placeholder="예: A교회, 베트남 호치민"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">사진 첨부 (선택)</label>
            <PhotoUploadZone
              onAttachmentsChange={(atts, uploading) => {
                setStoryImages(atts)
                setIsUploading(uploading)
              }}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              첫 번째 이미지(또는 &apos;대표 설정&apos; 이미지)가 썸네일로 사용됩니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">동영상 링크 (선택, 여러 개는 줄바꿈)</label>
            <textarea
              rows={3}
              value={form.videoUrls}
              onChange={(e) => setForm({ ...form, videoUrls: e.target.value })}
              placeholder="유튜브·Vimeo 링크를 한 줄씩 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">태그 (선택, 쉼표로 구분)</label>
            <input
              maxLength={200}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="예: 베트남, 청소년, 의료"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
              className="mt-0.5"
            />
            <span className="text-xs text-gray-500">
              사진·영상에 등장하는 분들의 동의를 받았으며, 초상권·개인정보 보호 정책을 준수하여 작성했음을 확인합니다.
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || isUploading}
            className="w-full py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50"
          >
            {isUploading ? '업로드 중...' : submitting ? '제출 중...' : '이야기 올리기 (검토 후 게시)'}
          </button>
        </form>
      </div>
    </div>
  )
}
