'use client'

import { useState, useEffect, useCallback } from 'react'

interface EmailLogRow {
  id: string
  subject: string
  targetRole: string
  totalCount: number
  sentCount: number
  failedCount: number
  sentBy: string | null
  createdAt: string
}

interface Recipient {
  id: string
  email: string
  name: string | null
  status: string
  errorMsg: string | null
}

const TARGET_LABELS: Record<string, string> = {
  ALL: '전체 회원', MEMBER: '일반회원', PREMIUM: '정회원', OFFICER: '임원', ADMIN: '관리자',
}

export function EmailLogList() {
  const [logs, setLogs] = useState<EmailLogRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [selectedLog, setSelectedLog] = useState<EmailLogRow | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'FAILED' | 'SUCCESS'>('ALL')

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/email/logs?page=${p}`)
      if (!res.ok) return
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs(page) }, [fetchLogs, page])

  const fetchDetail = async (log: EmailLogRow, f: 'ALL' | 'FAILED' | 'SUCCESS') => {
    setSelectedLog(log)
    setFilter(f)
    setDetailLoading(true)
    try {
      const q = f === 'ALL' ? '' : `&filter=${f}`
      const res = await fetch(`/api/admin/email/logs?id=${log.id}${q}`)
      if (!res.ok) return
      const data = await res.json()
      setRecipients(data.recipients ?? [])
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => { setSelectedLog(null); setRecipients([]) }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-3xl mb-2">📭</p>
        <p className="text-gray-500 text-sm">발송 이력이 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      <p className="text-xs text-gray-400 mb-3">
        총 <span className="font-semibold text-gray-600">{total}</span>건의 발송 이력
      </p>

      {/* ── 이력 목록 테이블 ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 font-medium">
              <th className="px-4 py-3 text-left">발송일시</th>
              <th className="px-4 py-3 text-left">제목</th>
              <th className="px-4 py-3 text-left">대상</th>
              <th className="px-4 py-3 text-center">전체</th>
              <th className="px-4 py-3 text-center">성공</th>
              <th className="px-4 py-3 text-center">실패</th>
              <th className="px-4 py-3 text-left">발송자</th>
              <th className="px-4 py-3 text-right">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{log.subject}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {TARGET_LABELS[log.targetRole] ?? log.targetRole}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gray-700">{log.totalCount}</td>
                <td className="px-4 py-3 text-center font-semibold text-green-600">{log.sentCount}</td>
                <td className="px-4 py-3 text-center">
                  {log.failedCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => fetchDetail(log, 'FAILED')}
                      className="font-semibold text-red-500 hover:underline"
                    >
                      {log.failedCount}
                    </button>
                  ) : (
                    <span className="text-gray-300">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px] truncate">
                  {log.sentBy ?? '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => fetchDetail(log, 'ALL')}
                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-[#1B3A6B] hover:text-[#1B3A6B] transition-colors"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded text-xs font-medium ${
                p === page
                  ? 'bg-[#1B3A6B] text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── 상세 모달 ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{selectedLog.subject}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(selectedLog.createdAt).toLocaleString('ko-KR')} · {TARGET_LABELS[selectedLog.targetRole]} ·
                  발송 {selectedLog.sentBy ?? '-'}
                </p>
              </div>
              <button type="button" onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* 요약 */}
            <div className="px-6 py-3 bg-gray-50 flex gap-6 text-center border-b border-gray-100">
              <div><p className="text-lg font-bold text-[#1B3A6B]">{selectedLog.totalCount}</p><p className="text-xs text-gray-400">전체</p></div>
              <div><p className="text-lg font-bold text-green-600">{selectedLog.sentCount}</p><p className="text-xs text-gray-400">성공</p></div>
              {selectedLog.failedCount > 0 && (
                <div><p className="text-lg font-bold text-red-500">{selectedLog.failedCount}</p><p className="text-xs text-gray-400">실패</p></div>
              )}
            </div>

            {/* 필터 */}
            <div className="px-6 py-3 flex gap-2 border-b border-gray-100">
              {(['ALL', 'FAILED', 'SUCCESS'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => fetchDetail(selectedLog, f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f
                      ? f === 'FAILED' ? 'bg-red-100 text-red-700' : f === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-[#1B3A6B] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'ALL' ? '전체' : f === 'FAILED' ? '실패만' : '성공만'}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400 self-center">{recipients.length}건</span>
            </div>

            {/* 수신자 목록 */}
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {detailLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : recipients.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">해당하는 수신자가 없습니다.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="pb-2 text-left">이름</th>
                      <th className="pb-2 text-left">이메일</th>
                      <th className="pb-2 text-center">상태</th>
                      <th className="pb-2 text-left">실패 원인</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recipients.map((r) => (
                      <tr key={r.id} className={r.status === 'FAILED' ? 'bg-red-50' : ''}>
                        <td className="py-2 pr-3 text-gray-700">{r.name ?? '-'}</td>
                        <td className="py-2 pr-3 text-gray-500">{r.email}</td>
                        <td className="py-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                            r.status === 'SUCCESS'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {r.status === 'SUCCESS' ? '성공' : '실패'}
                          </span>
                        </td>
                        <td className="py-2 text-red-500 max-w-[200px]">
                          {r.errorMsg ?? <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
