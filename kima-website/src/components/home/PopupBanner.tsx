'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Popup {
  id: string
  title: string
  body: string | null
  imageUrl: string | null
  imageWidth: string | null
  youtubeId: string | null
  linkUrl: string | null
  linkLabel: string | null
}

const STORAGE_KEY = 'kima_popup_hidden'

function getHiddenSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as Record<string, number>
    const now = Date.now()
    return new Set(
      Object.entries(parsed)
        .filter(([, exp]) => exp > now)
        .map(([id]) => id)
    )
  } catch {
    return new Set()
  }
}

function hideToday(id: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    const midnight = new Date()
    midnight.setHours(23, 59, 59, 999)
    parsed[id] = midnight.getTime()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch {}
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full rounded-lg"
      />
    </div>
  )
}

export function PopupBanner() {
  const [popups, setPopups] = useState<Popup[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/popups')
      .then((r) => r.json())
      .then((data) => {
        const hidden = getHiddenSet()
        const active = (data.popups as Popup[] ?? []).filter((p) => !hidden.has(p.id))
        if (active.length > 0) {
          setPopups(active)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!visible || popups.length === 0) return null

  const popup = popups[currentIndex]

  const handleClose = () => {
    if (popups.length > 1 && currentIndex < popups.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setVisible(false)
    }
  }

  const handleHideToday = () => {
    hideToday(popup.id)
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 — 항상 이미지 위에 표시 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 여러 팝업 인디케이터 */}
        {popups.length > 1 && (
          <div className="flex justify-center gap-1.5 pt-3 pb-1">
            {popups.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? 'bg-[#1B3A6B]' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}

        {/* 이미지 — imageWidth 미설정 시 팝업 전체 너비, 설정 시 중앙 정렬 */}
        {!popup.youtubeId && popup.imageUrl && (
          popup.imageWidth ? (
            <div className={`flex justify-center ${popups.length > 1 ? '' : 'rounded-t-2xl overflow-hidden'}`}>
              <Image
                src={popup.imageUrl}
                alt={popup.title}
                width={800}
                height={600}
                className="h-auto object-contain"
              />
            </div>
          ) : (
            <div className={`relative w-full ${popups.length > 1 ? '' : 'rounded-t-2xl overflow-hidden'}`}>
              <Image
                src={popup.imageUrl}
                alt={popup.title}
                width={800}
                height={600}
                className="w-full h-auto object-contain"
              />
            </div>
          )
        )}

        {/* 유튜브 */}
        {popup.youtubeId && (
          <div className="px-5 pt-5">
            <YouTubeEmbed videoId={popup.youtubeId} />
          </div>
        )}

        {/* 제목 + 본문 + 링크 + 하단 버튼 */}
        <div className="p-5">
          <h2 className="text-base font-bold text-[#1B3A6B] mb-3 pr-6">{popup.title}</h2>

          {popup.body && (
            <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{popup.body}</p>
          )}

          {popup.linkUrl && (
            <a
              href={popup.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-2.5 bg-[#C8922A] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity mb-4"
            >
              {popup.linkLabel || '자세히 보기'}
            </a>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleHideToday}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              오늘 하루 보지 않기
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
