'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageLightbox } from '@/components/story/ImageLightbox'

interface ImageItem {
  url: string
  name: string
}

interface Props {
  images: ImageItem[]
}

export function PostAttachmentGallery({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  const urls = images.map((img) => img.url)
  const [first, ...rest] = images

  return (
    <div className="space-y-3">
      {/* 첫 번째 이미지: 전체 너비 */}
      <div
        className="rounded-xl overflow-hidden bg-gray-50 cursor-zoom-in group"
        onClick={() => setLightboxIndex(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={first.url}
          alt={first.name}
          className="w-full h-auto block group-hover:brightness-95 transition-[filter] duration-200"
        />
      </div>

      {/* 나머지 이미지: 그리드 */}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rest.map((img, i) => (
            <button
              key={i}
              type="button"
              aria-label={`첨부 이미지 ${i + 2} 크게 보기`}
              onClick={() => setLightboxIndex(i + 1)}
              className="relative w-full h-44 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in group"
            >
              <Image
                src={img.url}
                alt={img.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-white drop-shadow"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={urls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
