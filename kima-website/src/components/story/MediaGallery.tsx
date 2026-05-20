'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  images: string[]
  title: string
}

export function MediaGallery({ images, title }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  const prev = useCallback(() => {
    setSelected((i) => (i !== null && i > 0 ? i - 1 : i))
  }, [])

  const next = useCallback(() => {
    setSelected((i) => (i !== null && i < images.length - 1 ? i + 1 : i))
  }, [images.length])

  useEffect(() => {
    if (selected === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, prev, next])

  // 라이트박스 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = selected !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            aria-label={`${title} ${i + 1} 확대 보기`}
            className="aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#C8922A] relative"
          >
            <Image
              src={src}
              alt={`${title} ${i + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* 라이트박스 */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="사진 확대 보기"
        >
          <div
            className="relative max-w-4xl w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 */}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-lg leading-none transition-colors"
              aria-label="닫기"
            >
              ✕
            </button>

            {/* 이미지 */}
            <div className="relative h-[80vh] w-full">
              <Image
                src={images[selected]}
                alt={`${title} ${selected + 1}`}
                fill
                className="object-contain rounded-lg"
              />
            </div>

            {/* 페이지 표시 */}
            <p className="text-white/60 text-sm mt-3">
              {selected + 1} / {images.length}
            </p>

            {/* 이전 버튼 */}
            {selected > 0 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-xl transition-colors"
                aria-label="이전 사진"
              >
                ‹
              </button>
            )}

            {/* 다음 버튼 */}
            {selected < images.length - 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white text-xl transition-colors"
                aria-label="다음 사진"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
