'use client'

import { useState, useRef, useCallback } from 'react'

interface Props {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  className?: string
}

export function ThumbnailUpload({
  value,
  onChange,
  label = '대표 이미지 (선택)',
  className = '',
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(value ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''

      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      setUploading(true)
      setError('')

      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload/resource', { method: 'POST', body: fd })
        const json = await res.json() as { url?: string; error?: string }
        if (!res.ok) {
          setError(json.error ?? '업로드 실패')
          setPreviewUrl(value ?? null)
          return
        }
        const serverUrl = json.url!
        setPreviewUrl(serverUrl)
        onChange(serverUrl)
      } catch {
        setError('업로드 중 오류가 발생했습니다.')
        setPreviewUrl(value ?? null)
      } finally {
        setUploading(false)
      }
    },
    [value, onChange],
  )

  const handleRemove = () => {
    setPreviewUrl(null)
    onChange(null)
    setError('')
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {previewUrl ? (
        <div className="relative w-44 h-28 rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="대표 이미지" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100"
              aria-label="대표 이미지 삭제"
            >
              <span className="text-white text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/80">
                삭제
              </span>
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-44 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#1B3A6B]/50 hover:text-[#1B3A6B] hover:bg-[#1B3A6B]/5 transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 12V6a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 6v12a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18v-6z" />
          </svg>
          <span className="text-xs">{uploading ? '업로드 중...' : '이미지 선택'}</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="대표 이미지 파일 선택"
        className="hidden"
        onChange={handleFileSelect}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <p className="text-xs text-gray-400 mt-1">썸네일로 사용됩니다 (선택사항)</p>
    </div>
  )
}
