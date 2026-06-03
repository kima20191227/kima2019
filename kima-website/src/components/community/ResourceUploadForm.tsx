'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadResourceFile } from '@/lib/uploadClient'

interface ResourceUploadFormProps {
  categoryId: string
  categoryName: string
}

type UploadMode = 'file' | 'url'


export function ResourceUploadForm({ categoryId, categoryName }: ResourceUploadFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState<UploadMode>('file')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    driveUrl: '',
    accessLevel: 'MEMBER' as string,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError('')
    setSelectedFile(file)
    if (file && !form.title) {
      const name = file.name.replace(/\.[^/.]+$/, '')
      set('title', name)
    }
  }

  const handleSubmit = () => {
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return }

    if (mode === 'file') {
      if (!selectedFile) { setError('파일을 선택해주세요.'); return }
    } else {
      if (!form.driveUrl.trim()) { setError('구글 드라이브 URL을 입력해주세요.'); return }
      if (!form.driveUrl.includes('drive.google.com')) {
        setError('구글 드라이브 링크만 등록 가능합니다 (drive.google.com)'); return
      }
    }
    setError('')

    startTransition(async () => {
      try {
        let driveUrl = form.driveUrl
        let fileType: string | undefined

        if (mode === 'file' && selectedFile) {
          setUploading(true)
          const uploaded = await uploadResourceFile(selectedFile)
          driveUrl = uploaded.url
          fileType = uploaded.fileType
        }

        const res = await fetch('/api/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            driveUrl,
            fileType,
            section: 'MINISTRY',
            accessLevel: form.accessLevel,
            categoryId,
          }),
        })

        const data = await res.json().catch(() => null) as { error?: string } | null
        if (!res.ok) {
          setError(data?.error ?? '등록에 실패했습니다.')
          return
        }

        setSuccess('자료가 등록되었습니다!')
        setForm({ title: '', description: '', driveUrl: '', accessLevel: 'MEMBER' })
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        setTimeout(() => { setSuccess(''); setOpen(false) }, 1500)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일 업로드에 실패했습니다.')
      } finally {
        setUploading(false)
      }
    })
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
    setSelectedFile(null)
    setForm({ title: '', description: '', driveUrl: '', accessLevel: 'MEMBER' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[#1B3A6B] font-medium hover:underline"
      >
        + 자료 등록
      </button>
    )
  }

  return (
    <div className="mt-4 border border-[#1B3A6B]/20 rounded-xl p-4 bg-blue-50/50 space-y-3">
      <p className="text-xs font-semibold text-[#1B3A6B]">자료 등록 — {categoryName}</p>

      {/* 모드 탭 */}
      <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
        {([['file', '📁 파일 업로드'], ['url', '🔗 링크 입력']] as const).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => { setMode(val); setError('') }}
            className={`flex-1 text-xs py-1 rounded-md transition-colors font-medium ${
              mode === val
                ? 'bg-[#1B3A6B] text-white'
                : 'text-gray-500 hover:text-[#1B3A6B]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 파일 업로드 모드 */}
      {mode === 'file' && (
        <div>
          <label htmlFor="resource-file" className="block text-xs text-gray-500 mb-1">
            파일 선택 *
          </label>
          <input
            id="resource-file"
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={isPending}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] file:mr-2 file:text-xs file:border-0 file:bg-[#1B3A6B] file:text-white file:rounded file:px-2 file:py-0.5 file:cursor-pointer"
          />
        </div>
      )}

      {/* 링크 입력 모드 */}
      {mode === 'url' && (
        <div>
          <label htmlFor="resource-url" className="block text-xs text-gray-500 mb-1">
            구글 드라이브 URL *
          </label>
          <input
            id="resource-url"
            type="url"
            value={form.driveUrl}
            onChange={(e) => set('driveUrl', e.target.value)}
            placeholder="https://drive.google.com/..."
            disabled={isPending}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
          />
        </div>
      )}

      {/* 제목 */}
      <div>
        <label htmlFor="resource-title" className="block text-xs text-gray-500 mb-1">제목 *</label>
        <input
          id="resource-title"
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="자료 제목"
          disabled={isPending}
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
        />
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="resource-desc" className="block text-xs text-gray-500 mb-1">설명 (선택)</label>
        <input
          id="resource-desc"
          type="text"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="간단한 설명"
          disabled={isPending}
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
        />
      </div>

      {/* 접근 등급 */}
      <div>
        <label htmlFor="resource-access" className="block text-xs text-gray-500 mb-1">접근 등급</label>
        <select
          id="resource-access"
          value={form.accessLevel}
          onChange={(e) => set('accessLevel', e.target.value)}
          disabled={isPending}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        >
          <option value="PUBLIC">공개</option>
          <option value="MEMBER">회원</option>
          <option value="PREMIUM">정회원</option>
        </select>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600 font-medium">{success}</p>}

      {uploading && (
        <p className="text-xs text-[#1B3A6B] animate-pulse">구글 드라이브에 업로드 중...</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {isPending ? '등록 중…' : '등록'}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}
