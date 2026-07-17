'use client'

import { useState } from 'react'
import Image from 'next/image'
import { convertDriveUrl } from '@/lib/utils'
import { ImageLightbox } from '@/components/story/ImageLightbox'
import { PdfEmbedViewer } from '@/components/ui/PdfEmbedViewer'

export interface Attachment {
  url: string
  name: string
  type: string
}

interface Props {
  attachments: Attachment[]
}

function isImage(att: Attachment): boolean {
  return att.type.startsWith('image/')
}

function isPdf(att: Attachment): boolean {
  return att.type.includes('pdf') || att.name.toLowerCase().endsWith('.pdf')
}

function DocIcon({ type }: { type: string }) {
  if (type === 'application/x-drive-link') {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    )
  }
  if (type.includes('video')) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  )
}

export function AttachmentSection({ attachments }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (attachments.length === 0) return null

  const images = attachments.filter(isImage)
  const pdfs = attachments.filter((att) => !isImage(att) && isPdf(att))
  const docs = attachments.filter((att) => !isImage(att) && !isPdf(att))

  const imageUrls = images.map((img) => convertDriveUrl(img.url))

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">첨부파일</h3>

      {/* 이미지 갤러리 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              aria-label={`첨부 이미지 ${i + 1} 크게 보기`}
              onClick={() => setLightboxIndex(i)}
              className="relative w-full h-44 rounded-lg overflow-hidden bg-gray-100 cursor-zoom-in group"
            >
              <Image
                src={convertDriveUrl(img.url)}
                alt={img.name}
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
          ))}
        </div>
      )}

      {/* PDF 인라인 뷰어 */}
      {pdfs.length > 0 && (
        <div className="space-y-4">
          {pdfs.map((pdf, i) => (
            <PdfEmbedViewer key={i} url={pdf.url} name={pdf.name} />
          ))}
        </div>
      )}

      {/* 기타 문서 다운로드 카드 */}
      {docs.length > 0 && (
        <ul className="space-y-2">
          {docs.map((doc, i) => (
            <li key={i}>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#1B3A6B]/40 hover:bg-gray-100 transition-colors"
              >
                <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1B3A6B]/10 shrink-0 text-[#1B3A6B]">
                  <DocIcon type={doc.type} />
                </span>
                <span className="flex-1 text-sm text-gray-700 truncate">{doc.name}</span>
                <span className="text-sm text-[#1B3A6B] font-medium shrink-0">열기</span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={imageUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  )
}
