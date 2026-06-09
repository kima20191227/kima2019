'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadResourceFile } from '@/lib/uploadClient'

interface ResourceUploadFormProps {
  categoryId: string
  categoryName: string
}

type UploadMode = 'file' | 'url'

const MAX_FILES = 3

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<string[]>([])

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setError('')
    if (files.length > MAX_FILES) {
      setError(`파일은 최대 ${MAX_FILES}개까지 선택할 수 있습니다.`)
      return
    }
    setSelectedFiles(files)
    if (files.length === 1 && !form.title) {
      set('title', files[0].name.replace(/\.[^/.]+$/, ''))
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setForm({ title: '', description: '', driveUrl: '', accessLevel: 'MEMBER' })
    setSelectedFiles([])
    setUploadProgress([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = () => {
    if (mode === 'file') {
      if (selectedFiles.length === 0) { setError('파일을 선택해주세요.'); return }
      if (selectedFiles.length === 1 && !form.title.trim()) {
        setError('제목을 입력해주세요.'); return
      }
    } else {
      if (!form.title.trim()) { setError('제목을 입력해주세요.'); return }
      if (!form.driveUrl.trim()) { setError('구글 드라이브 URL을 입력해주세요.'); return }
      if (!form.driveUrl.includes('drive.google.com')) {
        setError('구글 드라이브 링크만 등록 가능합니다 (drive.google.com)'); return
      }
    }
    setError('')

    startTransition(async () => {
      try {
        if (mode === 'url') {
          const res = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: form.title.trim(),
              description: form.description.trim() || undefined,
              driveUrl: form.driveUrl,
              section: 'MINISTRY',
              accessLevel: form.accessLevel,
              categoryId,
            }),
          })
          const data = await res.json().catch(() => null) as { error?: string } | null
          if (!res.ok) { setError(data?.error ?? '등록에 실패했습니다.'); return }
        } else {
          // 파일 업로드: 각 파일을 순서대로 업로드 후 등록
          const progress: string[] = selectedFiles.map((f) => `대기: ${f.name}`)
          setUploadProgress([...progress])

          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i]
            const itemTitle = selectedFiles.length === 1
              ? (form.title.trim() || file.name.replace(/\.[^/.]+$/, ''))
              : file.name.replace(/\.[^/.]+$/, '')

            progress[i] = `업로드 중: ${file.name}`
            setUploadProgress([...progress])

            const uploaded = await uploadResourceFile(file)

            progress[i] = `등록 중: ${file.name}`
            setUploadProgress([...progress])

            const res = await fetch('/api/resources', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: itemTitle,
                description: selectedFiles.length === 1 ? (form.description.trim() || undefined) : undefined,
                driveUrl: uploaded.url,
                fileType: uploaded.fileType,
                section: 'MINISTRY',
                accessLevel: form.accessLevel,
                categoryId,
              }),
            })
            const data = await res.json().catch(() => null) as { error?: string } | null
            if (!res.ok) {
              progress[i] = `실패: ${file.name} — ${data?.error ?? '오류 발생'}`
              setUploadProgress([...progress])
              setError(`${file.name} 등록에 실패했습니다.`)
              return
            }

            progress[i] = `완료: ${file.name}`
            setUploadProgress([...progress])
          }
        }

        setSuccess(mode === 'file' && selectedFiles.length > 1
          ? `${selectedFiles.length}개 자료가 등록되었습니다!`
          : '자료가 등록되었습니다!')
        resetForm()
        setTimeout(() => { setSuccess(''); setOpen(false) }, 1500)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일 업로드에 실패했습니다.')
      }
    })
  }

  const handleClose = () => {
    setOpen(false)
    setError('')
    resetForm()
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
            onClick={() => { setMode(val); setError(''); setUploadProgress([]) }}
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
        <div className="space-y-2">
          <label htmlFor="resource-file" className="block text-xs text-gray-500">
            파일 선택 * <span className="text-gray-400">(최대 {MAX_FILES}개)</span>
          </label>
          <input
            id="resource-file"
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            disabled={isPending}
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] file:mr-2 file:text-xs file:border-0 file:bg-[#1B3A6B] file:text-white file:rounded file:px-2 file:py-0.5 file:cursor-pointer"
          />
          {/* 선택된 파일 목록 */}
          {selectedFiles.length > 0 && (
            <ul className="space-y-1">
              {selectedFiles.map((file, i) => (
                <li key={i} className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                  <span className="truncate text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={isPending}
                    className="ml-2 text-gray-400 hover:text-red-500 shrink-0"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
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

      {/* 제목 (단일 파일 또는 URL 모드) */}
      {(mode === 'url' || selectedFiles.length <= 1) && (
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
      )}
      {mode === 'file' && selectedFiles.length > 1 && (
        <p className="text-xs text-gray-400">여러 파일 선택 시 파일명이 제목으로 자동 사용됩니다.</p>
      )}

      {/* 설명 */}
      {(mode === 'url' || selectedFiles.length <= 1) && (
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
      )}

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

      {/* 업로드 진행 상황 */}
      {uploadProgress.length > 0 && (
        <ul className="space-y-1">
          {uploadProgress.map((msg, i) => (
            <li key={i} className={`text-xs px-2 py-1 rounded ${
              msg.startsWith('완료') ? 'text-green-600 bg-green-50' :
              msg.startsWith('실패') ? 'text-red-500 bg-red-50' :
              'text-[#1B3A6B] bg-blue-50 animate-pulse'
            }`}>{msg}</li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600 font-medium">{success}</p>}

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
