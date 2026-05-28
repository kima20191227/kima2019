'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type ForumType = 'FORUM' | 'LISTENING_CALL'

interface ScheduleItem {
  time: string
  title: string
  speaker: string
}

interface MaterialItem {
  title: string
  fileType: string
  url: string
  file?: File
  uploading?: boolean
}

interface InitialData {
  id: string
  seq: string
  type: ForumType
  title: string
  date: string
  location: string | null
  theme: string | null
  description: string | null
  videoUrls: string[]
  photos: string[]
  isPublished: boolean
  schedules: { time: string; title: string; speaker: string | null }[]
  materials: { title: string; fileType: string; url: string }[]
}

interface Props {
  mode?: 'create' | 'edit'
  initialData?: InitialData
  defaultType?: ForumType
  triggerLabel?: string
  onClose?: () => void
}

const FILE_TYPES = ['PDF', 'PPT', 'DOCX', 'HWP', 'VIDEO', 'LINK', 'ZIP', '기타']

const emptySchedule = (): ScheduleItem => ({ time: '', title: '', speaker: '' })
const emptyMaterial = (): MaterialItem => ({ title: '', fileType: 'PDF', url: '' })

export function ForumArchiveForm({ mode = 'create', initialData, defaultType, triggerLabel, onClose }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [uploadMsg, setUploadMsg] = useState('')

  const [form, setForm] = useState({
    seq: initialData?.seq ?? '',
    type: (initialData?.type ?? defaultType ?? 'LISTENING_CALL') as ForumType,
    title: initialData?.title ?? '',
    date: initialData?.date ?? '',
    location: initialData?.location ?? '',
    theme: initialData?.theme ?? '',
    description: initialData?.description ?? '',
    isPublished: initialData?.isPublished ?? false,
  })

  const [schedules, setSchedules] = useState<ScheduleItem[]>(
    initialData?.schedules?.length
      ? initialData.schedules.map((s) => ({ time: s.time, title: s.title, speaker: s.speaker ?? '' }))
      : []
  )

  const [materials, setMaterials] = useState<MaterialItem[]>(
    initialData?.materials?.length
      ? initialData.materials.map((m) => ({ title: m.title, fileType: m.fileType, url: m.url }))
      : []
  )

  const [videoUrls, setVideoUrls] = useState<string[]>(
    initialData?.videoUrls?.length ? [...initialData.videoUrls] : []
  )

  const [photos, setPhotos] = useState<string[]>(
    initialData?.photos?.length ? [...initialData.photos] : []
  )

  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>(
    initialData?.photos?.length ? [...initialData.photos] : []
  )

  const photoInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const handleOpen = () => {
    setError('')
    setUploadMsg('')
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  // --- Photo handling ---
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPendingPhotos((prev) => [...prev, ...files].slice(0, 30))
    setPhotoPreviewUrls((prev) => {
      const newUrls = files.map((f) => URL.createObjectURL(f))
      return [...prev, ...newUrls].slice(0, 30)
    })
    e.target.value = ''
  }, [])

  const removePhoto = useCallback((i: number) => {
    const isPending = i >= photos.length
    if (isPending) {
      const pendingIdx = i - photos.length
      setPendingPhotos((prev) => prev.filter((_, idx) => idx !== pendingIdx))
      setPhotoPreviewUrls((prev) => {
        URL.revokeObjectURL(prev[i])
        return prev.filter((_, idx) => idx !== i)
      })
    } else {
      setPhotos((prev) => prev.filter((_, idx) => idx !== i))
      setPhotoPreviewUrls((prev) => prev.filter((_, idx) => idx !== i))
    }
  }, [photos.length])

  // --- Material file upload (immediate) ---
  const handleMaterialFileSelect = async (idx: number, file: File) => {
    setMaterials((prev) =>
      prev.map((m, i) => i === idx ? { ...m, file, uploading: true } : m)
    )
    setUploadMsg('자료 업로드 중...')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'materials')

    const res = await fetch('/api/upload/forum', { method: 'POST', body: fd })
    const data = await res.json()

    setUploadMsg('')
    if (res.ok && data.url) {
      const ext = file.name.split('.').pop()?.toUpperCase() || '기타'
      const detectedType = FILE_TYPES.includes(ext) ? ext : '기타'
      setMaterials((prev) =>
        prev.map((m, i) =>
          i === idx ? { ...m, url: data.url, fileType: detectedType, uploading: false, file: undefined } : m
        )
      )
    } else {
      setMaterials((prev) =>
        prev.map((m, i) => i === idx ? { ...m, uploading: false, file: undefined } : m)
      )
      setError(data.error ?? '자료 업로드에 실패했습니다.')
    }
  }

  // --- Submit ---
  const handleSubmit = () => {
    if (!form.seq.trim()) { setError('순서/회차를 입력해주세요.'); return }
    if (!form.title.trim()) { setError('제목을 입력해주세요.'); return }
    if (!form.date.trim()) { setError('날짜를 입력해주세요.'); return }

    const invalidMaterial = materials.find((m) => !m.title.trim() || !m.url.trim())
    if (invalidMaterial) { setError('자료의 제목과 파일/URL을 모두 입력해주세요.'); return }

    const invalidSchedule = schedules.find((s) => !s.time.trim() || !s.title.trim())
    if (invalidSchedule) { setError('일정표의 시간과 내용을 모두 입력해주세요.'); return }

    setError('')

    startTransition(async () => {
      // Upload pending photos first
      const uploadedPhotoUrls: string[] = [...photos]
      if (pendingPhotos.length > 0) {
        setUploadMsg(`사진 업로드 중... (0/${pendingPhotos.length})`)
        for (let i = 0; i < pendingPhotos.length; i++) {
          const fd = new FormData()
          fd.append('file', pendingPhotos[i])
          fd.append('folder', 'photos')
          const res = await fetch('/api/upload/forum', { method: 'POST', body: fd })
          const data = await res.json()
          if (!res.ok) {
            setUploadMsg('')
            setError(data.error ?? '사진 업로드에 실패했습니다.')
            return
          }
          uploadedPhotoUrls.push(data.url)
          setUploadMsg(`사진 업로드 중... (${i + 1}/${pendingPhotos.length})`)
        }
        setUploadMsg('')
      }

      const payload = {
        seq: form.seq.trim(),
        type: form.type,
        title: form.title.trim(),
        date: form.date.trim(),
        location: form.location.trim() || null,
        theme: form.theme.trim() || null,
        description: form.description.trim() || null,
        isPublished: form.isPublished,
        videoUrls: videoUrls.filter((u) => u.trim()),
        photos: uploadedPhotoUrls,
        schedules: schedules
          .filter((s) => s.time.trim() && s.title.trim())
          .map((s, i) => ({ time: s.time.trim(), title: s.title.trim(), speaker: s.speaker.trim() || null, order: i })),
        materials: materials
          .filter((m) => m.title.trim() && m.url.trim())
          .map((m, i) => ({ title: m.title.trim(), fileType: m.fileType, url: m.url.trim(), order: i })),
      }

      const url = mode === 'edit' && initialData
        ? `/api/admin/forum-archives/${initialData.id}`
        : '/api/admin/forum-archives'
      const method = mode === 'edit' ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '저장에 실패했습니다.')
        return
      }

      router.refresh()
      handleClose()
    })
  }

  const isLoading = isPending

  const triggerButton = mode === 'edit' ? (
    <button
      type="button"
      onClick={handleOpen}
      className="text-xs text-[#1B3A6B] hover:underline"
    >
      수정
    </button>
  ) : (
    <button
      type="button"
      onClick={handleOpen}
      className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white text-sm font-medium rounded-lg hover:bg-[#15306b] transition-colors"
    >
      + {triggerLabel ?? '새 자료 등록'}
    </button>
  )

  return (
    <>
      {triggerButton}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1B3A6B]">
                {mode === 'edit' ? '아카이브 수정' : '새 포럼·리스닝콜 아카이브 등록'}
              </h2>
              <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">유형 *</label>
                  <select
                    value={form.type}
                    onChange={(e) => set('type', e.target.value as ForumType)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                  >
                    <option value="LISTENING_CALL">🎙 리스닝콜</option>
                    <option value="FORUM">🏛 포럼</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">순서/회차 *</label>
                  <input
                    type="text"
                    value={form.seq}
                    onChange={(e) => set('seq', e.target.value)}
                    placeholder="예: 16차, 4회 포럼"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="예: 제16차 전국 이주민 사역자 리스닝콜"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">날짜 *</label>
                  <input
                    type="text"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    placeholder="예: 2025년 9월"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">장소</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="예: 사랑교회 안성수양관"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">주제</label>
                <input
                  type="text"
                  value={form.theme}
                  onChange={(e) => set('theme', e.target.value)}
                  placeholder="포럼 주제 슬로건"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">개요</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  placeholder="행사 개요 및 설명"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none resize-none"
                />
              </div>

              {/* 일정표 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">일정표</label>
                  <button
                    type="button"
                    onClick={() => setSchedules((prev) => [...prev, emptySchedule()])}
                    className="text-xs text-[#1B3A6B] hover:underline"
                  >
                    + 일정 추가
                  </button>
                </div>
                {schedules.length === 0 && (
                  <p className="text-xs text-gray-400 italic">일정 추가 버튼으로 항목을 추가하세요.</p>
                )}
                <div className="space-y-2">
                  {schedules.map((s, i) => (
                    <div key={i} className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="text"
                        value={s.time}
                        onChange={(e) => setSchedules((prev) => prev.map((item, idx) => idx === i ? { ...item, time: e.target.value } : item))}
                        placeholder="시간"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                      />
                      <input
                        type="text"
                        value={s.title}
                        onChange={(e) => setSchedules((prev) => prev.map((item, idx) => idx === i ? { ...item, title: e.target.value } : item))}
                        placeholder="내용"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                      />
                      <input
                        type="text"
                        value={s.speaker}
                        onChange={(e) => setSchedules((prev) => prev.map((item, idx) => idx === i ? { ...item, speaker: e.target.value } : item))}
                        placeholder="발표자 (선택)"
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setSchedules((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 발표 자료 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">발표 자료</label>
                  <button
                    type="button"
                    onClick={() => setMaterials((prev) => [...prev, emptyMaterial()])}
                    className="text-xs text-[#1B3A6B] hover:underline"
                  >
                    + 자료 추가
                  </button>
                </div>
                {materials.length === 0 && (
                  <p className="text-xs text-gray-400 italic">자료 추가 버튼으로 항목을 추가하세요.</p>
                )}
                <div className="space-y-2">
                  {materials.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => setMaterials((prev) => prev.map((item, idx) => idx === i ? { ...item, title: e.target.value } : item))}
                          placeholder="자료 제목"
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none bg-white"
                        />
                        <select
                          value={m.fileType}
                          onChange={(e) => setMaterials((prev) => prev.map((item, idx) => idx === i ? { ...item, fileType: e.target.value } : item))}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none bg-white"
                        >
                          {FILE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => setMaterials((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={m.url}
                          onChange={(e) => setMaterials((prev) => prev.map((item, idx) => idx === i ? { ...item, url: e.target.value } : item))}
                          placeholder="파일 URL (직접 입력) 또는 아래에서 파일 업로드"
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none bg-white"
                        />
                        <label className="cursor-pointer">
                          <span className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${m.uploading ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-[#1B3A6B] border-[#1B3A6B]/30 hover:bg-[#1B3A6B]/5'}`}>
                            {m.uploading ? '업로드중...' : '파일 선택'}
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            disabled={m.uploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleMaterialFileSelect(i, file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                      {m.url && (
                        <p className="text-xs text-green-600 truncate">✓ {m.url}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 사진 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">사진</label>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="text-xs text-[#1B3A6B] hover:underline"
                  >
                    + 사진 추가
                  </button>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
                {photoPreviewUrls.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">사진 추가 버튼으로 업로드하세요. (최대 30장)</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {photoPreviewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        <Image src={url} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xl"
                        >
                          ×
                        </button>
                        {i >= photos.length && (
                          <span className="absolute bottom-1 left-1 text-xs bg-[#C8922A] text-white px-1 rounded">새 파일</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 영상 URL */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">영상 URL (YouTube 등)</label>
                  <button
                    type="button"
                    onClick={() => setVideoUrls((prev) => [...prev, ''])}
                    className="text-xs text-[#1B3A6B] hover:underline"
                  >
                    + URL 추가
                  </button>
                </div>
                {videoUrls.length === 0 && (
                  <p className="text-xs text-gray-400 italic">YouTube embed URL을 추가하세요. (예: https://www.youtube.com/embed/...)</p>
                )}
                <div className="space-y-2">
                  {videoUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setVideoUrls((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                        placeholder="https://www.youtube.com/embed/..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setVideoUrls((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-300 hover:text-red-400 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 공개 여부 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="fa-published"
                  checked={form.isPublished}
                  onChange={(e) => set('isPublished', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1B3A6B]"
                />
                <label htmlFor="fa-published" className="text-sm text-gray-700">
                  공개 (체크 해제 시 관리자만 볼 수 있습니다)
                </label>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {uploadMsg && <p className="text-sm text-[#1B3A6B]">{uploadMsg}</p>}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-5 py-2 text-sm font-medium bg-[#1B3A6B] text-white rounded-lg hover:bg-[#15306b] transition-colors disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : (mode === 'edit' ? '수정 저장' : '등록')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
