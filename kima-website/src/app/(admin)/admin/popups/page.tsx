'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { PopupForm } from '@/components/admin/PopupForm'

interface Popup {
  id: string
  title: string
  body: string | null
  imageUrl: string | null
  imageWidth: string | null
  youtubeId: string | null
  linkUrl: string | null
  linkLabel: string | null
  startAt: string
  endAt: string
  isActive: boolean
  createdAt: string
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ popup }: { popup: Popup }) {
  const now = new Date()
  const start = new Date(popup.startAt)
  const end = new Date(popup.endAt)
  if (!popup.isActive) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">비활성</span>
  if (now < start) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">예약</span>
  if (now > end) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500">종료</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">게시중</span>
}

export default function AdminPopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Popup | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPopups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/popups')
      const data = await res.json()
      setPopups(data.popups ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPopups() }, [fetchPopups])

  const handleToggle = async (popup: Popup) => {
    await fetch(`/api/admin/popups/${popup.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !popup.isActive }),
    })
    fetchPopups()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 팝업을 삭제하시겠습니까?')) return
    setDeleting(id)
    await fetch(`/api/admin/popups/${id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchPopups()
  }

  const closeForm = () => { setShowForm(false); setEditing(null); fetchPopups() }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">팝업 관리</h1>
          <p className="text-sm text-gray-500 mt-1">홈페이지에 표시할 팝업을 등록·관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="px-4 py-2 bg-[#1B3A6B] text-white text-sm font-medium rounded-lg hover:bg-[#142d54] transition-colors"
        >
          + 팝업 등록
        </button>
      </div>

      {/* 등록/수정 폼 */}
      {(showForm || editing) && (
        <div className="bg-white rounded-2xl border border-[#1B3A6B]/20 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-[#1B3A6B] mb-5">
            {editing ? '팝업 수정' : '새 팝업 등록'}
          </h2>
          <PopupForm
            initial={editing ? {
              id: editing.id,
              title: editing.title,
              body: editing.body ?? '',
              imageUrl: editing.imageUrl ?? '',
              imageWidth: editing.imageWidth ?? '',
              youtubeId: editing.youtubeId ?? '',
              linkUrl: editing.linkUrl ?? '',
              linkLabel: editing.linkLabel ?? '',
              startAt: new Date(editing.startAt).toISOString().slice(0, 16),
              endAt: new Date(editing.endAt).toISOString().slice(0, 16),
              isActive: editing.isActive,
            } : undefined}
            onClose={closeForm}
          />
        </div>
      )}

      {/* 팝업 목록 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : popups.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            등록된 팝업이 없습니다.
          </div>
        ) : (
          popups.map((popup) => (
            <div key={popup.id} className="px-5 py-4">
              <div className="flex items-start gap-4">
                {/* 썸네일 */}
                {(popup.imageUrl || popup.youtubeId) && (
                  <div className="w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                    {popup.youtubeId ? (
                      <Image
                        src={`https://img.youtube.com/vi/${popup.youtubeId}/mqdefault.jpg`}
                        alt="썸네일"
                        fill
                        className="object-cover"
                      />
                    ) : popup.imageUrl ? (
                      <Image src={popup.imageUrl} alt="썸네일" fill className="object-contain bg-white" />
                    ) : null}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{popup.title}</p>
                    <StatusBadge popup={popup} />
                  </div>
                  {popup.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{popup.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {fmtDate(popup.startAt)} ~ {fmtDate(popup.endAt)}
                  </p>
                  <div className="flex gap-1.5 mt-1">
                    {popup.youtubeId && <span className="text-xs text-red-500">YouTube</span>}
                    {popup.imageUrl && <span className="text-xs text-blue-500">이미지</span>}
                    {popup.linkUrl && <span className="text-xs text-green-600">링크</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* 활성/비활성 토글 */}
                  <button
                    type="button"
                    aria-label={popup.isActive ? '비활성으로 전환' : '활성으로 전환'}
                    onClick={() => handleToggle(popup)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${popup.isActive ? 'bg-[#1B3A6B]' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${popup.isActive ? 'translate-x-4' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditing(popup); setShowForm(false) }}
                    className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(popup.id)}
                    disabled={deleting === popup.id}
                    className="text-xs px-2.5 py-1 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
