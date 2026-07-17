'use client'

import { useCallback, useRef, useState } from 'react'
import { uploadResourceFile } from '@/lib/uploadClient'

export interface AttachedFile {
  url: string
  name: string
  type: string
  isCover?: boolean
}

interface UploadItem {
  id: string
  name: string
  type: string
  status: 'uploading' | 'done' | 'error'
  url?: string
  errorMsg?: string
  isCover: boolean
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

function isImage(type: string) {
  return type.startsWith('image/')
}

// 이미지가 하나라도 있으면 대표 이미지는 항상 하나 존재하도록 보정한다.
// 이미 지정된 대표가 있으면 그대로 두고, 없으면 첫 번째 이미지를 대표로 승격한다.
function ensureCover(items: UploadItem[]): UploadItem[] {
  const images = items.filter((item) => isImage(item.type))
  if (images.length === 0) return items
  if (images.some((item) => item.isCover)) return items
  const firstImageId = images[0].id
  return items.map((item) => ({ ...item, isCover: item.id === firstImageId }))
}

function FileIcon({ type }: { type: string }) {
  if (type === 'application/x-drive-link') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    )
  }
  if (type.startsWith('image/')) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 12V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18v-6z" />
      </svg>
    )
  }
  if (type.includes('pdf')) {
    return <span className="text-[9px] font-bold">PDF</span>
  }
  if (type.includes('video')) {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  )
}

export function FileAttachmentZone({
  initialFiles = [],
  onChange,
  label = '파일 첨부 (선택)',
  maxFiles = 20,
  className = '',
}: Props) {
  const [items, setItems] = useState<UploadItem[]>(() =>
    ensureCover(
      initialFiles.map((file) => ({
        id: makeId(),
        name: file.name,
        type: file.type,
        status: 'done' as const,
        url: file.url,
        isCover: file.isCover ?? false,
      })),
    ),
  )
  const [isDragging, setIsDragging] = useState(false)
  const [driveOpen, setDriveOpen] = useState(false)
  const [driveInput, setDriveInput] = useState('')
  const [driveError, setDriveError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const notify = useCallback(
    (updated: UploadItem[]) => {
      const done = updated
        .filter((item) => item.status === 'done' && item.url)
        .map((item) => ({ url: item.url!, name: item.name, type: item.type, isCover: item.isCover }))
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
          // 업로드 응답으로 실제 MIME 타입이 확정되므로 대표 이미지 보정을 다시 수행한다.
          const next = ensureCover(
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'done' as const, url: uploaded.url, type: uploaded.fileType ?? item.type }
                : item,
            ),
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
          isCover: false,
        }))
        const next = ensureCover([...prev, ...newItems])
        notify(next)
        setTimeout(() => {
          newItems.forEach((item, index) => uploadOne(item.id, selected[index]))
        }, 0)
        return next
      })
    },
    [maxFiles, uploadOne, notify],
  )

  const addDriveLink = useCallback(() => {
    const url = driveInput.trim()
    if (!url) { setDriveError('URL을 입력해주세요.'); return }
    if (!url.includes('drive.google.com')) {
      setDriveError('구글 드라이브 링크만 등록 가능합니다.')
      return
    }
    setItems((prev) => {
      if (prev.length >= maxFiles) {
        setDriveError(`최대 ${maxFiles}개까지 추가할 수 있습니다.`)
        return prev
      }
      const newItem: UploadItem = {
        id: makeId(),
        name: '드라이브 링크',
        type: 'application/x-drive-link',
        status: 'done',
        url,
        isCover: false,
      }
      const next = [...prev, newItem]
      notify(next)
      return next
    })
    setDriveInput('')
    setDriveError('')
    setDriveOpen(false)
  }, [driveInput, maxFiles, notify])

  const setCover = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.map((item) => ({ ...item, isCover: item.id === id }))
        notify(next)
        return next
      })
    },
    [notify],
  )

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        // 대표 이미지를 지우면 남은 첫 이미지가 대표로 승격된다.
        const next = ensureCover(prev.filter((item) => item.id !== id))
        notify(next)
        return next
      })
    },
    [notify],
  )

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* 파일 드롭존 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
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
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

      {/* 구글 드라이브 링크 추가 */}
      <div className="mt-2">
        {!driveOpen ? (
          <button
            type="button"
            onClick={() => { setDriveOpen(true); setDriveError('') }}
            className="flex items-center gap-1 text-xs text-[#1B3A6B] hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            구글 드라이브 링크 추가
          </button>
        ) : (
          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                type="url"
                value={driveInput}
                onChange={(e) => { setDriveInput(e.target.value); setDriveError('') }}
                placeholder="https://drive.google.com/..."
                autoFocus
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDriveLink() } }}
              />
              <button
                type="button"
                onClick={addDriveLink}
                className="px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium hover:bg-[#142d54] transition-colors"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => { setDriveOpen(false); setDriveInput(''); setDriveError('') }}
                className="px-2 py-2 rounded-lg border border-gray-200 text-gray-400 text-xs hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
            {driveError && <p className="text-xs text-red-500">{driveError}</p>}
          </div>
        )}
      </div>

      {/* 첨부 목록 */}
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1B3A6B]/10 shrink-0 text-[#1B3A6B]">
                <FileIcon type={item.type} />
              </div>

              <span className="flex-1 text-xs text-gray-700 truncate">{item.name}</span>

              {item.status === 'done' && isImage(item.type) && (
                <button
                  type="button"
                  onClick={() => setCover(item.id)}
                  className={`shrink-0 px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                    item.isCover
                      ? 'bg-[#C8922A] text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {item.isCover ? '대표이미지 ✓' : '대표 설정'}
                </button>
              )}

              {item.status === 'uploading' && (
                <div className="w-4 h-4 border-2 border-[#1B3A6B] border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              {item.status === 'error' && (
                <span className="text-xs text-red-500 shrink-0 truncate max-w-55" title={item.errorMsg}>
                  {item.errorMsg}
                </span>
              )}
              {item.status === 'done' && item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[#1B3A6B] hover:underline shrink-0"
                >
                  열기
                </a>
              )}

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
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
