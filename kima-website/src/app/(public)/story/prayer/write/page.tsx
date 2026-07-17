'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'
import { ColumnEditor } from '@/components/column/ColumnEditor'

export default function PrayerWritePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    content: '',
    urgency: 'NORMAL',
    visibility: 'PUBLIC',
    requesterName: '',
    agree: false,
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
    if (!form.agree) { setError('개인정보 관련 안내에 동의해 주세요.'); return }
    setSubmitting(true)
    setError('')
    try {
      const images = attachments.filter((a) => a.type.startsWith('image/')).map((a) => a.url)
      const coverImage = attachments.find((a) => a.isCover && a.type.startsWith('image/'))
      const firstImage = attachments.find((a) => a.type.startsWith('image/'))
      const thumbnail = coverImage?.url ?? firstImage?.url ?? null

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PRAYER_REQUEST',
          title: form.title,
          content: form.content,
          urgency: form.urgency,
          visibility: form.visibility,
          requesterName: form.requesterName || null,
          thumbnail,
          images,
          attachments,
          status: 'APPROVED',
        }),
      })
      if (!res.ok) throw new Error('서버 오류')
      router.push('/story/prayer')
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-2">기도 요청하기</h1>
        <p className="text-sm text-gray-500 mb-8">함께 기도해 줄 분들을 위해 기도 제목을 나눠주세요.</p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">작성 안내</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>제목에 기도 제목을 한 줄로 요약해 주세요. 예: &quot;○○형제 수술을 위해&quot;</li>
            <li>본문에는 상황을 간단히 설명하고 구체적인 기도 내용을 적어주세요.</li>
            <li>민감한 개인정보(실명·질병명·연락처)는 꼭 필요한 경우가 아니면 생략해 주세요.</li>
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
              placeholder="예: ○○선교사님 건강 회복을 위해"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">기도 내용 *</label>
            <ColumnEditor
              content={form.content}
              onChange={handleContentChange}
              placeholder="상황을 간단히 설명하고, 어떻게 기도해 주시면 좋을지 적어주세요."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">긴급도</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                title="긴급도"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              >
                <option value="NORMAL">일반</option>
                <option value="URGENT">긴급</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">공개 범위</label>
              <select
                value={form.visibility}
                onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                title="공개 범위"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              >
                <option value="PUBLIC">전체 공개</option>
                <option value="MEMBER">로그인 회원만</option>
                <option value="PRAYER_TEAM">기도팀만</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">요청자 이름 (선택)</label>
            <input
              maxLength={50}
              value={form.requesterName}
              onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
              placeholder="실명, 이니셜, 익명 모두 가능합니다"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

          <div>
            <FileAttachmentZone
              label="사진·자료 첨부 (선택) — 이미지·PDF·문서"
              initialFiles={attachments}
              onChange={(files, uploading) => {
                setAttachments(files)
                setIsUploading(uploading)
              }}
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
              민감한 개인정보를 제외하고 작성했으며, 게시 내용에 대한 책임이 본인에게 있음을 확인합니다.
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting || isUploading}
            className="w-full py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50"
          >
            {isUploading ? '업로드 중...' : submitting ? '제출 중...' : '기도 요청 올리기'}
          </button>
        </form>
      </div>
    </div>
  )
}
