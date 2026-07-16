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

export function PopupBanner({ popups }: { popups: Popup[] }) {
  // SSR에서 바로 팝업이 보이도록 초기값을 prop 기준으로 설정 (hydration mismatch 없음)
  const [activePopups, setActivePopups] = useState<Popup[]>(popups)

  // 마운트 후 localStorage "오늘 하루 보지 않기" 필터링
  // (숨긴 사용자에게 잠깐 보였다 사라지는 flash는 허용된 트레이드오프)
  useEffect(() => {
    const hidden = getHiddenSet()
    setActivePopups(popups.filter((p) => !hidden.has(p.id)))
  }, [popups])

  if (activePopups.length === 0) return null

  const handleClose = (id: string) => {
    setActivePopups((prev) => prev.filter((p) => p.id !== id))
  }

  const handleHideToday = (id: string) => {
    hideToday(id)
    handleClose(id)
  }

  return (
    <div className="fixed inset-0 z-1300 flex items-center justify-center bg-black/50 p-4">
      <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {activePopups.map((popup, idx) => (
          <div
            key={popup.id}
            className="relative bg-white rounded-2xl shadow-2xl w-full md:w-[min(90vw,420px)] max-h-[90vh] overflow-y-auto shrink-0"
          >
            {/* 닫기 버튼 — 항상 이미지 위에 표시 */}
            <button
              type="button"
              aria-label="팝업 닫기"
              onClick={() => handleClose(popup.id)}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 이미지 — 고정 높이 컨테이너로 로드 전 높이를 확정하여 CLS 제거.
                imageWidth 설정 시 내부 래퍼 maxWidth로 축소 표시 의도를 보존(높이는 컨테이너가 확정). */}
            {!popup.youtubeId && popup.imageUrl && (
              <div className="relative w-full h-[min(50vh,420px)] rounded-t-2xl overflow-hidden">
                {popup.imageWidth ? (
                  <div className="absolute inset-0 mx-auto" style={{ maxWidth: popup.imageWidth }}>
                    <Image
                      src={popup.imageUrl}
                      alt={popup.title}
                      fill
                      priority={idx === 0}
                      sizes="(max-width: 768px) calc(100vw - 2rem), 420px"
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <Image
                    src={popup.imageUrl}
                    alt={popup.title}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) calc(100vw - 2rem), 420px"
                    className="object-contain"
                  />
                )}
              </div>
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
                  onClick={() => handleHideToday(popup.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  오늘 하루 보지 않기
                </button>
                <button
                  type="button"
                  onClick={() => handleClose(popup.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
