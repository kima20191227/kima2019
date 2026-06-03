'use client'

import { useCallback, useRef, useState } from 'react'
import { uploadResourceFile } from '@/lib/uploadClient'


export interface AttachedFile {
  url: string
  name: string
  type: string
}

interface UploadItem {
  id: string
  name: string
  type: string
  status: 'uploading' | 'done' | 'error'
  url?: string
  errorMsg?: string
}

interface Props {
  initialFiles?: AttachedFile[]
  onChange: (files: AttachedFile[], isUploading: boolean) => void
  label?: string
  maxFiles?: number
  className?: string
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function FileAttachmentZone({
  initialFiles = [],
  onChange,
  label = '파일 첨부 (선택)',
  maxFiles = 20,
  className = '',
}: Props) {
  const [items, setItems] = useState<UploadItem[]>(() =>
    initialFiles.map((file) => ({
      id: makeId(),
      name: file.name,
      type: file.type,
      status: 'done' as const,
      url: file.url,
    })),
  )
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const notify = useCallback(
    (updated: UploadItem[]) => {
      const done = updated
        .filter((item) => item.status === 'done' && item.url)
        .map((item) => ({ url: item.url!, name: item.name, type: item.type }))
      const isUploading = updated.some((item) => item.status === 'uploading')
      onChange(done, isUploading)
    },
    [onChange],
  )

  const uploadOne = useCallback(
    async (itemId: string, file: File) => {
      try {
        const uploaded = await uploadResourceFile(file)
        setItems((prev) => {
          const next = prev.map((item) =>
            item.id === itemId
              ? { ...item, status: 'done' as const, url: uploaded.url, type: uploaded.fileType ?? item.type }
              : item,
          )
          notify(next)
          return next
        })
      } catch (err) {
        setItems((prev) => {
          const next = prev.map((item) =>
            item.id === itemId
              ? { ...item, status: 'error' as const, errorMsg: err instanceof Error ? err.message : '업로드 실패' }
              : item,
          )
          notify(next)
          return next
        })
      }
    },
    [notify],
  )

  const addFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return
      setItems((prev) => {
        const remaining = maxFiles - prev.length
        if (remaining <= 0) return prev
        const selected = files.slice(0, remaining)
        const newItems: UploadItem[] = selected.map((file) => ({
          id: makeId(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          status: 'uploading' as const,
        }))
        notify([...prev, ...newItems])
        setTimeout(() => {
          newItems.forEach((item, index) => uploadOne(item.id, selected[index]))
        }, 0)
        return [...prev, ...newItems]
      })
    },
    [maxFiles, uploadOne, notify],
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item.id !== id)
        notify(next)
        return next
      })
    },
    [notify],
  )

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(Array.from(e.dataTransfer.files))
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl py-6 px-4 text-center cursor-pointer transition-all select-none ${
          isDragging
            ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 scale-[1.01]'
            : 'border-gray-200 hover:border-[#1B3A6B]/50 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          aria-label="첨부 파일 선택"
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
        />
        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
          <p className="text-sm text-gray-600">
            파일을 끌어다 놓거나{' '}
            <span className="text-[#1B3A6B] underline font-medium">클릭하여 선택</span>
          </p>
          <p className="text-xs text-gray-400">
            이미지, PDF, 문서 등 모든 파일 · 최대 {maxFiles}개
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1B3A6B]/10 flex-shrink-0 text-[#1B3A6B]">
                {item.type.startsWith('image/') ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 12V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18v-6z" />
                  </svg>
                ) : item.type.includes('pdf') ? (
                  <span className="text-[9px] font-bold">PDF</span>
                ) : item.type.includes('video') ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                )}
              </div>

              <span className="flex-1 text-xs text-gray-700 truncate">{item.name}</span>

              {item.status === 'uploading' && (
                <div className="w-4 h-4 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              {item.status === 'error' && (
                <span className="text-xs text-red-500 flex-shrink-0 truncate max-w-[220px]" title={item.errorMsg}>
                  {item.errorMsg}
                </span>
              )}
              {item.status === 'done' && item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[#1B3A6B] hover:underline flex-shrink-0"
                >
                  열기
                </a>
              )}

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="파일 삭제"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
