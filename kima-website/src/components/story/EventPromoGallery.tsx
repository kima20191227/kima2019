'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageLightbox } from './ImageLightbox'

interface Props {
  thumbnail: string | null
  images: string[]
  title: string
}

export function EventPromoGallery({ thumbnail, images, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // 대표 이미지 + 갤러리 이미지를 하나의 배열로 합산
  const allImages = thumbnail
    ? [thumbnail, ...images.filter((src) => src !== thumbnail)]
    : images

  if (allImages.length === 0) return null

  return (
    <>
      {/* 대표 이미지 */}
      {thumbnail && (
        <div
          className="rounded-xl overflow-hidden bg-gray-50 relative w-full h-96 cursor-zoom-in"
          onClick={() => setLightboxIndex(0)}
        >
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-contain hover:scale-[1.02] transition-transform duration-200"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="bg-black/40 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              클릭하여 크게 보기
            </span>
          </div>
        </div>
      )}

      {/* 갤러리 */}
      {images.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">행사 사진</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((src, i) => {
              const lightboxIdx = thumbnail ? i + 1 : i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(lightboxIdx)}
                  className="relative w-full h-36 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in group"
                >
                  <Image
                    src={src}
                    alt={`행사 사진 ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-7 h-7 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* 라이트박스 */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
