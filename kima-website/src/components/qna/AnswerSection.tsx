'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoUploadZone } from '@/components/ui/PhotoUploadZone'
import type { PhotoAttachment } from '@/components/ui/PhotoUploadZone'
import { convertDriveUrl } from '@/lib/utils'

interface Answer {
  id: string
  content: string
  attachments?: PhotoAttachment[]
  createdAt: string
  author: { id: string; name: string | null }
}

interface Props {
  questionId: string
  answers: Answer[]
  currentUserId?: string
  isAdmin: boolean
  isLoggedIn: boolean
}

function renderContent(content: string) {
  const parts = content.split(/(\[img:[^\]]*\]\([^)]*\))/g)
  return parts.map((part, i) => {
    const match = part.match(/\[img:([^\]]*)\]\(([^)]*)\)/)
    if (match) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={convertDriveUrl(match[2])}
          alt={match[1]}
          className="max-w-full rounded-lg my-2 max-h-80 object-contain"
        />
      )
    }
    return (
      <span key={i} className="whitespace-pre-line">
        {part}
      </span>
    )
  })
}

export function AnswerSection({ questionId, answers, currentUserId, isAdmin, isLoggedIn }: Props) {
  const router = useRouter()

  // New answer state
  const [newContent, setNewContent] = useState('')
  const [newAttachments, setNewAttachments] = useState<PhotoAttachment[]>([])
  const [newIsUploading, setNewIsUploading] = useState(false)
  const [submittingNew, setSubmittingNew] = useState(false)
  const [newError, setNewError] = useState('')

  // Edit answer state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editAttachments, setEditAttachments] = useState<PhotoAttachment[]>([])
  const [editIsUploading, setEditIsUploading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function canManage(answer: Answer): boolean {
    return isAdmin || (!!currentUserId && answer.author.id === currentUserId)
  }

  function startEdit(answer: Answer) {
    setEditingId(answer.id)
    setEditContent(answer.content)
    setEditAttachments(answer.attachments ?? [])
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditContent('')
    setEditAttachments([])
  }

  async function handleSubmitNew(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim()) return
    setNewError('')
    setSubmittingNew(true)
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim(), attachments: newAttachments }),
      })
      if (!res.ok) {
        const data = await res.json()
        setNewError(data.error ?? '답변 등록 중 오류가 발생했습니다.')
        return
      }
      setNewContent('')
      setNewAttachments([])
      router.refresh()
    } catch {
      setNewError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmittingNew(false)
    }
  }

  async function handleUpdateAnswer(id: string) {
    if (!editContent.trim()) return
    setLoadingId(id)
    try {
      const res = await fetch(`/api/answers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim(), attachments: editAttachments }),
      })
      if (res.ok) {
        cancelEdit()
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDeleteAnswer(id: string) {
    setLoadingId(id)
    try {
      const res = await fetch(`/api/answers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmDeleteId(null)
        router.refresh()
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-4">답변 {answers.length}개</h2>

      {/* 답변 목록 */}
      <div className="space-y-4 mb-8">
        {answers.length === 0 && (
          <p className="text-sm text-gray-400 py-4">아직 등록된 답변이 없습니다.</p>
        )}
        {answers.map((answer) => {
          const attachedImages = (answer.attachments ?? []).filter((a) =>
            a.type?.startsWith('image/')
          )
          const inlineNames = new Set(
            Array.from(answer.content.matchAll(/\[img:([^\]]*)\]/g)).map((m) => m[1])
          )
          const galleryImages = attachedImages.filter((a) => !inlineNames.has(a.name))

          return (
            <div key={answer.id} className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">
                    {answer.author.name ?? '익명'}
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-400">
                    {new Date(answer.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {canManage(answer) && editingId !== answer.id && (
                  <div className="flex items-center gap-2">
                    {confirmDeleteId === answer.id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">삭제하시겠습니까?</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnswer(answer.id)}
                          disabled={loadingId === answer.id}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {loadingId === answer.id ? '...' : '삭제'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(answer)}
                          className="text-xs text-gray-500 hover:text-gray-800"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(answer.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingId === answer.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    placeholder="답변 내용을 입력해주세요"
                    title="답변 내용"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] bg-white"
                  />
                  <PhotoUploadZone
                    initialAttachments={editAttachments}
                    onAttachmentsChange={(atts, uploading) => {
                      setEditAttachments(atts)
                      setEditIsUploading(uploading)
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateAnswer(answer.id)}
                      disabled={loadingId === answer.id || !editContent.trim() || editIsUploading}
                      className="px-3 py-1.5 text-sm bg-[#1B3A6B] text-white rounded-lg hover:bg-[#15305a] disabled:opacity-50"
                    >
                      {loadingId === answer.id ? '저장 중...' : editIsUploading ? '업로드 중...' : '수정 완료'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {renderContent(answer.content)}
                  {galleryImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {galleryImages.map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={convertDriveUrl(img.url)}
                          alt={img.name}
                          className="w-full rounded-lg object-cover aspect-square"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 새 답변 작성 */}
      <div className="border-t border-gray-100 pt-6">
        {isLoggedIn ? (
          <form onSubmit={handleSubmitNew} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">답변 작성</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              placeholder="답변을 입력해주세요 (5자 이상)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
            <PhotoUploadZone
              onAttachmentsChange={(atts, uploading) => {
                setNewAttachments(atts)
                setNewIsUploading(uploading)
              }}
            />
            {newError && <p className="text-xs text-red-600">{newError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingNew || !newContent.trim() || newIsUploading}
                className="px-4 py-2 text-sm bg-[#1B3A6B] text-white rounded-lg hover:bg-[#15305a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newIsUploading ? '업로드 중...' : submittingNew ? '등록 중...' : '답변 등록'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500">
            답변 작성은{' '}
            <a href="/auth/login" className="text-[#1B3A6B] font-medium underline">
              로그인
            </a>{' '}
            후 가능합니다.
          </p>
        )}
      </div>
    </div>
  )
}
