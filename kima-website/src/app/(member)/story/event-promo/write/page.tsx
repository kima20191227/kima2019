'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { convertDriveUrl, convertDriveUrls } from '@/lib/utils'
import Image from 'next/image'

export default function EventPromoWritePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    authorName: '',
    eventLocation: '',
    websiteUrl: '',
    thumbnailUrl: '',
    imageUrls: '',
    videoUrls: '',
    tags: '',
    agree: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.agree) { setError('안내 사항에 동의해 주세요.'); return }
    setSubmitting(true)
    setError('')

    const images = form.imageUrls.split('\n').map((v) => v.trim()).filter(Boolean)
    const videoUrls = form.videoUrls.split('\n').map((v) => v.trim()).filter(Boolean)
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    const thumbnail = form.thumbnailUrl.trim() || images[0] || null

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EVENT_PROMO',
          title: form.title,
          content: form.content,
          excerpt: form.excerpt || null,
          authorName: form.authorName || null,
          eventLocation: form.eventLocation || null,
          linkUrl: form.websiteUrl || null,
          thumbnail,
          images,
          videoUrls,
          tags,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? '서버 오류')
      }
      router.push('/story/event-promo')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-1">이주민사역&amp;행사 홍보 등록</h1>
        <p className="text-sm text-gray-500 mb-8">이주민 사역과 관련된 행사를 소개하고 홍보할 수 있습니다.</p>

        <div className="bg-rose-50 rounded-xl p-4 mb-6 text-sm leading-relaxed">
          <p className="font-semibold text-rose-800 mb-1">작성 안내</p>
          <ul className="list-disc list-inside space-y-1 text-rose-700">
            <li>행사 제목, 일시, 장소, 내용을 상세히 기재해 주세요.</li>
            <li>이미지는 외부 링크(구글 드라이브, 이미지 호스팅 등) URL을 한 줄씩 입력해 주세요.</li>
            <li>유튜브·Vimeo 영상 링크를 추가하면 상세 페이지에서 바로 재생됩니다.</li>
            <li>게시 후 수정이 필요하면 관리자에게 문의해 주세요.</li>
          </ul>
        </div>

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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
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
              placeholder={`행사 일정, 장소, 내용, 참가 방법 등을 자세히 적어주세요.\n\n예)\n일시: 2025년 6월 15일 (일) 오후 2시\n장소: 서울 OO교회\n대상: 이주민 사역자 누구나\n내용: 강의, 나눔, 기도회`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 주최/작성자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">주최·작성자 (선택)</label>
              <input
                maxLength={50}
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="예: OO교회 선교팀"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
              />
            </div>
            {/* 행사 장소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">행사 장소 (선택)</label>
              <input
                maxLength={100}
                value={form.eventLocation}
                onChange={(e) => setForm({ ...form, eventLocation: e.target.value })}
                placeholder="예: 서울 강남구 OO교회"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
            <p className="text-xs text-gray-400 mt-1">행사 공식 홈페이지, 신청 폼, SNS 링크 등을 입력하세요.</p>
          </div>

          {/* 대표 이미지 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표 이미지 URL (선택)</label>
            <input
              type="url"
              maxLength={500}
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              onBlur={(e) => setForm((f) => ({ ...f, thumbnailUrl: convertDriveUrl(e.target.value) }))}
              placeholder="예: https://i.imgur.com/abc123.jpg 또는 구글 드라이브 공유 링크"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
            <p className="text-xs text-gray-400 mt-1">구글 드라이브 공유 링크를 붙여넣으면 자동으로 표시 가능한 주소로 변환됩니다.</p>
            {form.thumbnailUrl && (
              <div className="mt-2 max-w-xs rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex justify-center relative h-48">
                <Image src={form.thumbnailUrl} alt="미리보기" fill className="object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
          </div>

          {/* 이미지 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이미지 링크 (선택, 여러 개는 줄바꿈)
            </label>
            <textarea
              rows={3}
              value={form.imageUrls}
              onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
              onBlur={(e) => setForm((f) => ({ ...f, imageUrls: convertDriveUrls(e.target.value) }))}
              placeholder={`이미지 URL을 한 줄씩 입력하세요\n첫 번째 이미지가 대표 이미지로 사용됩니다`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              구글 드라이브 공유 링크를 그대로 붙여넣으면 자동으로 변환됩니다.
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] resize-none font-mono"
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
          </div>

          {/* 동의 체크 */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
              className="mt-0.5"
            />
            <span className="text-xs text-gray-500">
              게시하는 이미지·내용이 해당 행사와 관련된 정확한 정보임을 확인하며, KIMA 커뮤니티 운영 원칙에 따라 작성하였음에 동의합니다.
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#15305a] transition-colors disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '행사 홍보 등록하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
