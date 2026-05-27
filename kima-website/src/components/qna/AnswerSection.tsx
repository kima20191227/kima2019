'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Answer {
  id: string
  content: string
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

export function AnswerSection({ questionId, answers, currentUserId, isAdmin, isLoggedIn }: Props) {
  const router = useRouter()
  const [newContent, setNewContent] = useState('')
  const [submittingNew, setSubmittingNew] = useState(false)
  const [newError, setNewError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function canManage(answer: Answer): boolean {
    return isAdmin || (!!currentUserId && answer.author.id === currentUserId)
  }

  function startEdit(answer: Answer) {
    setEditingId(answer.id)
    setEditContent(answer.content)
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditContent('')
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
        body: JSON.stringify({ content: newContent.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setNewError(data.error ?? '답변 등록 중 오류가 발생했습니다.')
        return
      }
      setNewContent('')
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
        body: JSON.stringify({ content: editContent.trim() }),
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
      {/* 답변 수 */}
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        답변 {answers.length}개
      </h2>

      {/* 답변 목록 */}
      <div className="space-y-4 mb-8">
        {answers.length === 0 && (
          <p className="text-sm text-gray-400 py-4">아직 등록된 답변이 없습니다.</p>
        )}
        {answers.map((answer) => (
          <div
            key={answer.id}
            className="rounded-xl border border-blue-100 bg-blue-50 p-5"
          >
            {/* 답변 헤더 */}
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

              {/* 수정·삭제 버튼 (권한 있을 때만) */}
              {canManage(answer) && editingId !== answer.id && (
                <div className="flex items-center gap-2">
                  {confirmDeleteId === answer.id ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">삭제하시겠습니까?</span>
                      <button
                        onClick={() => handleDeleteAnswer(answer.id)}
                        disabled={loadingId === answer.id}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {loadingId === answer.id ? '...' : '삭제'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(answer)}
                        className="text-xs text-gray-500 hover:text-gray-800"
                      >
                        수정
                      </button>
                      <button
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

            {/* 답변 본문 or 인라인 편집 */}
            {editingId === answer.id ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] bg-white"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleUpdateAnswer(answer.id)}
                    disabled={loadingId === answer.id || !editContent.trim()}
                    className="px-3 py-1.5 text-sm bg-[#1B3A6B] text-white rounded-lg hover:bg-[#15305a] disabled:opacity-50"
                  >
                    {loadingId === answer.id ? '저장 중...' : '수정 완료'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {answer.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 새 답변 작성 */}
      <div className="border-t border-gray-100 pt-6">
        {isLoggedIn ? (
          <form onSubmit={handleSubmitNew}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              답변 작성
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              placeholder="답변을 입력해주세요 (5자 이상)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
            />
            {newError && (
              <p className="mt-1.5 text-xs text-red-600">{newError}</p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingNew || !newContent.trim()}
                className="px-4 py-2 text-sm bg-[#1B3A6B] text-white rounded-lg hover:bg-[#15305a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingNew ? '등록 중...' : '답변 등록'}
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
