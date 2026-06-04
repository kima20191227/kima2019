'use client'

import { useState, useCallback } from 'react'
import { EmailLogList } from '@/components/admin/EmailLogList'

const TARGET_OPTIONS = [
  { value: 'ALL',     label: '전체 회원',         desc: '모든 등급 포함' },
  { value: 'MEMBER',  label: '일반회원',           desc: 'MEMBER 등급만' },
  { value: 'PREMIUM', label: '정회원',             desc: 'PREMIUM 등급만' },
  { value: 'OFFICER', label: '임원',               desc: 'OFFICER 등급만' },
  { value: 'ADMIN',   label: '관리자',             desc: 'ADMIN 등급만' },
]

type Target = 'ALL' | 'MEMBER' | 'PREMIUM' | 'OFFICER' | 'ADMIN'
type Step   = 'compose' | 'preview' | 'done'
type Tab    = 'send' | 'logs'

export default function AdminEmailPage() {
  const [tab, setTab] = useState<Tab>('send')

  const [target, setTarget]           = useState<Target>('ALL')
  const [subject, setSubject]         = useState('')
  const [body, setBody]               = useState('')
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [step, setStep]               = useState<Step>('compose')
  const [result, setResult]           = useState<{ total: number; sent: number; failed: number; logId: string | null } | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const fetchCount = useCallback(async (t: Target) => {
    const res = await fetch(`/api/admin/email?target=${t}`)
    if (res.ok) {
      const data = await res.json()
      setRecipientCount(data.count)
    }
  }, [])

  const handleTargetChange = (t: Target) => {
    setTarget(t)
    setRecipientCount(null)
    fetchCount(t)
  }

  const handlePreview = () => {
    if (!subject.trim()) { setError('제목을 입력해주세요.'); return }
    if (!body.trim())    { setError('내용을 입력해주세요.'); return }
    setError('')
    if (recipientCount === null) fetchCount(target)
    setStep('preview')
  }

  const handleSend = async () => {
    setLoading(true)
    setError('')
    try {
      const html = body
        .split('\n')
        .map((line) => `<p style="margin:0 0 12px;">${line || '&nbsp;'}</p>`)
        .join('')

      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, subject, html }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '발송 실패')
      setResult(data)
      setStep('done')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('compose')
    setSubject('')
    setBody('')
    setTarget('ALL')
    setRecipientCount(null)
    setResult(null)
    setError('')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B3A6B]">메일 발송</h1>
        <p className="text-sm text-gray-500 mt-1">전체 또는 등급별 회원에게 이메일을 일괄 발송합니다.</p>
      </div>

      {/* ── 탭 ── */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([
          { key: 'send' as Tab, label: '메일 작성' },
          { key: 'logs' as Tab, label: '발송 이력' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-[#1B3A6B] text-[#1B3A6B]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 발송 이력 탭 ── */}
      {tab === 'logs' && <EmailLogList />}

      {/* ── 메일 작성 탭 ── */}
      {tab === 'send' && (
        <>
          {/* 단계 표시 */}
          <div className="flex items-center gap-2 mb-8">
            {(['compose', 'preview', 'done'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s
                    ? 'bg-[#1B3A6B] text-white'
                    : step === 'done' || (step === 'preview' && i === 0)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {step === 'done' || (step === 'preview' && i === 0) ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${step === s ? 'font-semibold text-[#1B3A6B]' : 'text-gray-400'}`}>
                  {s === 'compose' ? '작성' : s === 'preview' ? '확인' : '완료'}
                </span>
                {i < 2 && <span className="text-gray-300 mx-1">›</span>}
              </div>
            ))}
          </div>

          {/* ── 작성 단계 ── */}
          {step === 'compose' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">수신 대상</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TARGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTargetChange(opt.value as Target)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        target === opt.value ? 'border-[#1B3A6B] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${target === opt.value ? 'text-[#1B3A6B]' : 'text-gray-700'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {recipientCount !== null && (
                  <p className="mt-2 text-sm text-[#C8922A] font-medium">예상 수신 인원: {recipientCount.toLocaleString()}명</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  메일 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="[KIMA] 제목을 입력하세요"
                  maxLength={200}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  메일 본문 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  {'{{이름}}'} 을 입력하면 수신자 이름으로 자동 치환됩니다.
                </p>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  placeholder={`안녕하세요, {{이름}}님.\n\nKIMA 한국이주민선교연합회입니다.\n\n...`}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-y font-mono"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="px-6 py-2.5 bg-[#1B3A6B] text-white rounded-lg text-sm font-semibold hover:bg-[#15306a] transition-colors"
                >
                  미리보기 →
                </button>
              </div>
            </div>
          )}

          {/* ── 확인 단계 ── */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-amber-800">발송 전 최종 확인</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  <li>수신 대상: <strong>{TARGET_OPTIONS.find((o) => o.value === target)?.label}</strong></li>
                  <li>예상 수신 인원: <strong>{recipientCount !== null ? `${recipientCount.toLocaleString()}명` : '조회 중...'}</strong></li>
                  <li>제목: <strong>{subject}</strong></li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-xs text-gray-500">메일 미리보기 (실제 수신 이름으로 치환됩니다)</p>
                </div>
                <div className="p-6 bg-white">
                  <p className="text-xs text-gray-400 mb-1">제목:</p>
                  <p className="font-semibold text-gray-800 mb-4">{subject}</p>
                  <hr className="mb-4" />
                  <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {body.replace(/\{\{이름\}\}/g, '홍길동')}
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setStep('compose')}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ← 수정하기
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#C8922A] text-white rounded-lg text-sm font-semibold hover:bg-[#b47e24] transition-colors disabled:opacity-50"
                >
                  {loading ? '발송 중...' : `${recipientCount ?? ''}명에게 발송`}
                </button>
              </div>
            </div>
          )}

          {/* ── 완료 단계 ── */}
          {step === 'done' && result && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-[#1B3A6B] mb-2">메일 발송 완료</h2>
              <div className="inline-flex gap-6 mt-4 bg-gray-50 rounded-xl px-8 py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1B3A6B]">{result.total}</p>
                  <p className="text-xs text-gray-500 mt-1">전체 대상</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.sent}</p>
                  <p className="text-xs text-gray-500 mt-1">발송 성공</p>
                </div>
                {result.failed > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{result.failed}</p>
                    <p className="text-xs text-gray-500 mt-1">발송 실패</p>
                  </div>
                )}
              </div>

              {result.failed > 0 && result.logId && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => { setTab('logs') }}
                    className="text-sm text-red-500 underline hover:text-red-700"
                  >
                    실패 {result.failed}건 상세 보기 →
                  </button>
                </div>
              )}

              <div className="mt-8 flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setTab('logs')}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  발송 이력 보기
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-[#1B3A6B] text-white rounded-lg text-sm font-semibold hover:bg-[#15306a] transition-colors"
                >
                  새 메일 작성
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
