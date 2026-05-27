'use client'

import { Fragment, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Answer {
  id: string
  content: string
  createdAt: string
  author: { name: string | null }
}

interface Question {
  id: string
  title: string
  content: string
  status: 'PENDING' | 'ANSWERED'
  isPublished: boolean
  createdAt: string
  author: { name: string | null }
  answers: Answer[]
}

interface Props {
  questions: Question[]
}

function ConfirmDelete({
  onConfirm,
  onCancel,
  pending,
  label = '삭제',
}: {
  onConfirm: () => void
  onCancel: () => void
  pending: boolean
  label?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-gray-500">삭제하시겠습니까?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={pending}
        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? '...' : label}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-2 py-1 text-xs border border-gray-200 rounded bg-white hover:bg-gray-50"
      >
        취소
      </button>
    </span>
  )
}

export function AdminQnaList({ questions }: Props) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [confirmQId, setConfirmQId] = useState<string | null>(null)
  const [confirmAId, setConfirmAId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
    setConfirmQId(null)
    setConfirmAId(null)
  }

  function deleteQuestion(id: string) {
    startTransition(async () => {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' })
      setConfirmQId(null)
      router.refresh()
    })
  }

  function deleteAnswer(id: string) {
    startTransition(async () => {
      await fetch(`/api/answers/${id}`, { method: 'DELETE' })
      setConfirmAId(null)
      router.refresh()
    })
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-400">
        등록된 질문이 없습니다.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
            <th className="px-4 py-3 text-left">제목</th>
            <th className="px-4 py-3 text-left">작성자</th>
            <th className="px-4 py-3 text-left">상태</th>
            <th className="px-4 py-3 text-left">답변</th>
            <th className="px-4 py-3 text-left">등록일</th>
            <th className="px-4 py-3 text-left">관리</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <Fragment key={q.id}>
              <tr
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                {/* 제목 */}
                <td className="px-4 py-3 max-w-xs">
                  <Link
                    href={`/story/qna/${q.id}`}
                    target="_blank"
                    className="font-medium text-gray-900 hover:text-[#1B3A6B] hover:underline line-clamp-1"
                  >
                    {q.title}
                  </Link>
                </td>

                {/* 작성자 */}
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {q.author.name ?? '익명'}
                </td>

                {/* 상태 */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.status === 'ANSWERED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {q.status === 'ANSWERED' ? '답변완료' : '답변대기'}
                  </span>
                </td>

                {/* 답변 수 / 펼치기 */}
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(q.id)}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {q.answers.length}개
                    {expandedId === q.id ? ' ▲' : ' ▼'}
                  </button>
                </td>

                {/* 등록일 */}
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                </td>

                {/* 삭제 */}
                <td className="px-4 py-3">
                  {confirmQId === q.id ? (
                    <ConfirmDelete
                      onConfirm={() => deleteQuestion(q.id)}
                      onCancel={() => setConfirmQId(null)}
                      pending={isPending}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmQId(q.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>

              {/* 펼친 답변 목록 */}
              {expandedId === q.id && (
                <tr key={`${q.id}-answers`} className="bg-blue-50">
                  <td colSpan={6} className="px-6 py-4">
                    {q.answers.length === 0 ? (
                      <p className="text-xs text-gray-400">등록된 답변이 없습니다.</p>
                    ) : (
                      <div className="space-y-3">
                        {q.answers.map((a) => (
                          <div
                            key={a.id}
                            className="bg-white rounded-lg border border-blue-100 px-4 py-3 flex items-start gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {a.author.name ?? '익명'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 whitespace-pre-line line-clamp-3">
                                {a.content}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {confirmAId === a.id ? (
                                <ConfirmDelete
                                  onConfirm={() => deleteAnswer(a.id)}
                                  onCancel={() => setConfirmAId(null)}
                                  pending={isPending}
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmAId(a.id)}
                                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
