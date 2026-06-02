'use client'

import { useState, useRef, useEffect } from 'react'
import { convertDriveUrl } from '@/lib/utils'
import { uploadResourceFile } from '@/lib/uploadClient'

const MAX_PHOTO_UPLOAD_MB = 100
const MAX_PHOTO_UPLOAD_BYTES = MAX_PHOTO_UPLOAD_MB * 1024 * 1024

export interface PhotoAttachment {
  url: string
  name: string
  type: string
  isCover?: boolean
}

interface InternalItem {
  id: string
  name: string
  mimeType: string
  localUrl: string
  serverUrl?: string
  isCover: boolean
  status: 'uploading' | 'done' | 'error'
  errorMsg?: string
}

interface Props {
  initialAttachments?: PhotoAttachment[]
  onAttachmentsChange: (attachments: PhotoAttachment[], isUploading: boolean) => void
  onInsertImage?: (text: string) => void
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function isImage(mime: string) {
  return mime.startsWith('image/')
}

export function PhotoUploadZone({ initialAttachments, onAttachmentsChange, onInsertImage }: Props) {
  const [items, setItems] = useState<InternalItem[]>(() => {
    if (!initialAttachments?.length) return []
    return initialAttachments.map((att) => ({
      id: makeId(),
      name: att.name,
      mimeType: att.type,
      localUrl: att.url,
      serverUrl: att.url,
      isCover: att.isCover ?? false,
      status: 'done' as const,
    }))
  })
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const done = items
      .filter((i) => i.status === 'done' && i.serverUrl)
      .map((i) => ({ url: convertDriveUrl(i.serverUrl!), name: i.name, type: i.mimeType, isCover: i.isCover }))
    const isUploading = items.some((i) => i.status === 'uploading')
    onAttachmentsChange(done, isUploading)
  }, [items]) // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadFile(id: string, file: File) {
    try {
      const data = await uploadResourceFile(file)
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, serverUrl: data.url, status: 'done' } : i))
      )
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: 'error', errorMsg: err instanceof Error ? err.message : '실패' }
            : i
        )
      )
    }
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files)
    const hasExistingCover = items.some((i) => i.isCover && isImage(i.mimeType))
    const newItems: InternalItem[] = arr.map((file, idx) => {
      const id = makeId()
      const localUrl = URL.createObjectURL(file)
      const shouldBeCover = !hasExistingCover && isImage(file.type) && idx === 0
      const oversized = file.size > MAX_PHOTO_UPLOAD_BYTES
      return {
        id,
        name: file.name,
        mimeType: file.type,
        localUrl,
        isCover: shouldBeCover,
        status: oversized ? 'error' as const : 'uploading' as const,
        errorMsg: oversized ? `File uploads are limited to ${MAX_PHOTO_UPLOAD_MB}MB or less.` : undefined,
      }
    })
    const ids = newItems.map((i) => i.id)
    setItems((prev) => [...prev, ...newItems])
    arr.forEach((file, idx) => {
      if (file.size <= MAX_PHOTO_UPLOAD_BYTES) uploadFile(ids[idx], file)
    })
  }

  function setCover(id: string) {
    setItems((prev) => prev.map((i) => ({ ...i, isCover: i.id === id })))
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item && item.localUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.localUrl)
      }
      const next = prev.filter((i) => i.id !== id)
      if (item?.isCover) {
        const firstImg = next.find((i) => isImage(i.mimeType))
        if (firstImg) return next.map((i) => ({ ...i, isCover: i.id === firstImg.id }))
      }
      return next
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl px-4 py-5 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-[#1B3A6B] bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <p className="text-sm text-gray-500">
          이미지를 드래그하거나{' '}
          <span className="text-[#1B3A6B] font-medium">클릭하여 선택</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, GIF, WEBP 등 · 파일당 최대 {MAX_PHOTO_UPLOAD_MB}MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          aria-label="이미지 파일 선택"
          onChange={(e) => {
            if (e.target.files?.length) {
              addFiles(e.target.files)
              e.target.value = ''
            }
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {items.map((item) => (
            <PhotoCard
              key={item.id}
              item={item}
              onSetCover={() => setCover(item.id)}
              onRemove={() => removeItem(item.id)}
              onInsert={
                onInsertImage && item.serverUrl
                  ? () => onInsertImage(`\n[img:${item.name}](${item.serverUrl})\n`)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PhotoCardProps {
  item: InternalItem
  onSetCover: () => void
  onRemove: () => void
  onInsert?: () => void
}

function PhotoCard({ item, onSetCover, onRemove, onInsert }: PhotoCardProps) {
  const displayUrl = item.serverUrl ? convertDriveUrl(item.serverUrl) : item.localUrl

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
      {isImage(item.mimeType) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayUrl} alt={item.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      )}

      {item.status === 'uploading' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {item.status === 'error' && (
        <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center gap-1 p-2">
          <span className="text-white text-xs font-medium">업로드 실패</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="text-xs text-red-200 underline"
          >
            삭제
          </button>
        </div>
      )}

      {item.status === 'done' && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
          {isImage(item.mimeType) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSetCover() }}
              className={`px-2 py-1 text-xs rounded font-medium ${
                item.isCover
                  ? 'bg-[#C8922A] text-white'
                  : 'bg-white/20 text-white hover:bg-white/40'
              }`}
            >
              {item.isCover ? '대표이미지 ✓' : '대표 설정'}
            </button>
          )}
          {onInsert && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onInsert() }}
              className="px-2 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/40"
            >
              본문에 삽입
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="px-2 py-1 text-xs bg-red-500/80 text-white rounded hover:bg-red-500"
          >
            삭제
          </button>
        </div>
      )}

      {item.isCover && item.status === 'done' && (
        <div className="absolute top-1.5 left-1.5 bg-[#C8922A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          대표
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
        <p className="text-white text-[10px] truncate">{item.name}</p>
      </div>
    </div>
  )
}
