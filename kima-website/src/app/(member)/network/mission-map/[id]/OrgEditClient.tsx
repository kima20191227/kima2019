'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const TYPE_OPTIONS = ['교회', 'NGO', '법률', '의료', '교육', '센터', '선교단체', '부설기관', '기타']
const TARGET_OPTIONS = ['이주노동자', '유학생', '결혼이민자', '다문화자녀', '난민미등록', '귀국이주민', '중보사역', '기타']
const LANG_OPTIONS = [
  '네팔어', '베트남어', '태국어', '라오스어', '몽골어', '러시아어',
  '중국&동포', '필리핀어', '캄보디아어', '미얀마어', '영어', '일본어',
  '스리랑카어', '아랍어', '힌디어', '기타',
]

interface EditData {
  type: string
  representative: string
  targets: string[]
  languages: string[]
  address: string
  phone: string
  email: string
  website: string
  introLines: string[]
  contactItems: string[]
}

interface Props {
  orgId: number | string
  routeId: string
  initial: EditData
  currentImage: string | null
}

export function OrgEditClient({ orgId, routeId, initial, currentImage }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<EditData>(initial)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageMessage, setImageMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const displayImage = previewUrl ?? currentImage

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setImageMessage(null)
  }

  const handleImageUpload = async () => {
    if (!selectedFile) return
    setUploadingImage(true)
    setImageMessage(null)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      const res = await fetch(`/api/member/gmfsns-orgs/${orgId}/image`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (res.ok) {
        setImageMessage({ ok: true, text: '이미지가 저장되었습니다.' })
        setSelectedFile(null)
        router.refresh()
      } else {
        setImageMessage({ ok: false, text: json.error ?? '이미지 업로드 실패' })
      }
    } catch {
      setImageMessage({ ok: false, text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setUploadingImage(false)
    }
  }

  const toggleArr = (key: 'targets' | 'languages', val: string) => {
    setForm((prev) => {
      const arr = prev[key]
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      }
    })
  }

  const updateLines = (key: 'introLines' | 'contactItems', text: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: text.split('\n').map((l) => l.trim()).filter(Boolean),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/member/gmfsns-orgs/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (res.ok) {
        setMessage({ ok: true, text: '저장되었습니다. 상세 페이지로 이동합니다...' })
        router.refresh()
        setTimeout(() => {
          router.push(`/network/mission-map/${routeId}`)
        }, 800)
      } else {
        setMessage({ ok: false, text: json.error ?? '저장 실패' })
      }
    } catch {
      setMessage({ ok: false, text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* ── 이미지 ─────────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">대표 이미지</label>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* 현재 이미지 미리보기 */}
          <div className="relative w-48 h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
            {displayImage ? (
              <Image
                src={displayImage}
                alt="단체 이미지"
                fill
                className="object-cover"
                sizes="192px"
                unoptimized={!!previewUrl}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {previewUrl && (
              <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                미저장
              </span>
            )}
          </div>

          {/* 업로드 영역 */}
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              title="이미지 파일 선택"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              이미지 선택
            </button>
            {selectedFile && (
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={uploadingImage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#15305a] disabled:opacity-50 transition-colors"
              >
                {uploadingImage ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    업로드 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    이미지 저장
                  </>
                )}
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG, WEBP, GIF · 최대 5MB</p>
            {imageMessage && (
              <p className={`text-xs font-medium ${imageMessage.ok ? 'text-green-600' : 'text-red-500'}`}>
                {imageMessage.text}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* ── 유형 ─────────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">사역 유형</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {TYPE_OPTIONS.map((t) => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="radio"
                name="type"
                checked={form.type === t}
                onChange={() => setForm((p) => ({ ...p, type: t }))}
                className="accent-[#1B3A6B]"
              />
              <span className="text-sm text-gray-700">{t}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              name="type"
              checked={!TYPE_OPTIONS.includes(form.type)}
              onChange={() => setForm((p) => ({ ...p, type: '' }))}
              className="accent-[#1B3A6B]"
            />
            <span className="text-sm text-gray-400">비워두기</span>
          </label>
        </div>
      </div>

      {/* ── 사역대상 ─────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">사역 대상</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {TARGET_OPTIONS.map((t) => (
            <label key={t} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.targets.includes(t)}
                onChange={() => toggleArr('targets', t)}
                className="w-4 h-4 accent-[#1B3A6B]"
              />
              <span className="text-sm text-gray-700">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 언어 ─────────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">사역 언어</label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LANG_OPTIONS.map((l) => (
            <label key={l} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.languages.includes(l)}
                onChange={() => toggleArr('languages', l)}
                className="w-4 h-4 accent-[#1B3A6B]"
              />
              <span className="text-sm text-gray-700">{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── 대표/담임목사 ─────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">대표 / 담임목사</label>
        <input
          type="text"
          value={form.representative}
          onChange={(e) => setForm((p) => ({ ...p, representative: e.target.value }))}
          placeholder="예: 홍길동 목사"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
        />
      </div>

      {/* ── 연락처 ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">전화번호</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="010-0000-0000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">이메일</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="contact@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-500 mb-1">홈페이지</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-500 mb-1">주소</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="도로명 주소"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          />
        </div>
      </div>

      {/* ── 사역소개 ─────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">사역소개 <span className="text-gray-400 font-normal text-xs">— 줄바꿈으로 항목 구분</span></label>
        <textarea
          value={form.introLines.join('\n')}
          onChange={(e) => updateLines('introLines', e.target.value)}
          rows={5}
          placeholder="사역 내용을 한 줄씩 입력하세요..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-y"
        />
      </div>

      {/* ── 연결정보 ─────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">연결정보 <span className="text-gray-400 font-normal text-xs">— 줄바꿈으로 항목 구분</span></label>
        <textarea
          value={form.contactItems.join('\n')}
          onChange={(e) => updateLines('contactItems', e.target.value)}
          rows={4}
          placeholder="전화번호: 010-0000-0000&#10;이메일: ...&#10;주소: ..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-y"
        />
      </div>

      {/* ── 저장 버튼 ─────────────────────────────── */}
      {message && (
        <p className={`text-sm font-medium ${message.ok ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#1B3A6B] text-white text-sm font-semibold rounded-lg hover:bg-[#15305a] disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/network/mission-map/${routeId}`)}
          className="px-6 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>

      {/* ── 하단 네비게이션 ──────────────────────── */}
      <div className="pt-6 border-t border-gray-100 flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => router.push(`/network/mission-map/${routeId}`)}
          className="flex items-center gap-1 text-[#1B3A6B] hover:underline font-medium"
        >
          ← 상세보기로 돌아가기
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={() => router.push('/network/mission-map')}
          className="flex items-center gap-1 text-gray-500 hover:text-[#1B3A6B] hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    </div>
  )
}
