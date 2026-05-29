'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ─── 검증 스키마 ──────────────────────────────────────────────────────────────

const schema = z.object({
  isEnabled:          z.boolean(),
  collectHour:        z.number().int().min(0).max(23),
  collectMinute:      z.number().int().min(0).max(59),
  aiProvider:         z.enum(['gemini', 'claude', 'openai', 'none']),
  relevanceThreshold: z.number().min(0).max(100),
  maxArticlesPerRun:  z.number().int().min(1).max(200),
})

type FormValues = z.infer<typeof schema>

// ─── DB 설정 타입 ─────────────────────────────────────────────────────────────

interface NewsSettingsData {
  isEnabled:          boolean
  collectHour:        number
  collectMinute:      number
  aiProvider:         string
  relevanceThreshold: number  // DB: 0.0~1.0
  maxArticlesPerRun:  number
  lastRunAt:          string | null
  lastRunStatus:      string | null
  lastRunCount:       number | null
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0') }

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">없음</span>
  const map: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    failed:  'bg-red-100 text-red-700',
    running: 'bg-blue-100 text-blue-700',
  }
  const labels: Record<string, string> = {
    success: '성공', failed: '실패', running: '실행 중',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function NewsSettingsForm() {
  const [loading,     setLoading]     = useState(true)
  const [saveMsg,     setSaveMsg]     = useState('')
  const [collectMsg,  setCollectMsg]  = useState('')
  const [collectDetail, setCollectDetail] = useState<string>('')
  const [collecting,  setCollecting]  = useState(false)
  const [lastRun,     setLastRun]     = useState<Pick<NewsSettingsData, 'lastRunAt' | 'lastRunStatus' | 'lastRunCount'>>({
    lastRunAt: null, lastRunStatus: null, lastRunCount: null,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      isEnabled:          false,
      collectHour:        9,
      collectMinute:      0,
      aiProvider:         'openai',
      relevanceThreshold: 50,
      maxArticlesPerRun:  50,
    },
  })

  const isEnabled          = watch('isEnabled')
  const relevanceThreshold = watch('relevanceThreshold')

  // ── 설정 불러오기 ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/admin/news-settings')
      .then((r) => r.json())
      .then(({ settings }: { settings: NewsSettingsData }) => {
        reset({
          isEnabled:          settings.isEnabled,
          collectHour:        settings.collectHour,
          collectMinute:      settings.collectMinute,
          aiProvider:         (settings.aiProvider as 'gemini' | 'claude' | 'openai' | 'none'),
          relevanceThreshold: Math.round(settings.relevanceThreshold * 100),  // 0-1 → 0-100
          maxArticlesPerRun:  settings.maxArticlesPerRun,
        })
        setLastRun({
          lastRunAt:     settings.lastRunAt,
          lastRunStatus: settings.lastRunStatus,
          lastRunCount:  settings.lastRunCount,
        })
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [reset])

  // ── 설정 저장 ─────────────────────────────────────────────────────────────

  const onSubmit = async (values: FormValues) => {
    setSaveMsg('')
    const res = await fetch('/api/admin/news-settings', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(values),
    })
    setSaveMsg(res.ok ? '✓ 저장됐습니다.' : '✗ 저장에 실패했습니다.')
    setTimeout(() => setSaveMsg(''), 3000)
  }

  // ── 수동 수집 ─────────────────────────────────────────────────────────────

  const handleCollectNow = async () => {
    setCollecting(true)
    setCollectMsg('수집 중...')
    setCollectDetail('')
    try {
      const res  = await fetch('/api/admin/collect-now', { method: 'POST' })
      const data = await res.json() as {
        message?: string
        saved?: number
        collected?: number
        processed?: number
        totalFetched?: number
        sourceStats?: { name: string; type: string; fetched: number; error?: string }[]
        envStatus?: { GEMINI_API_KEY: boolean; NAVER_NEWS_CLIENT_ID: boolean; NAVER_NEWS_CLIENT_SECRET: boolean }
        error?: string
      }

      if (res.ok) {
        const saved = data.saved ?? 0
        const collected = data.collected ?? 0
        const totalFetched = data.totalFetched ?? 0
        setCollectMsg(`✓ ${data.message ?? `${saved}건 저장 완료`}`)
        setLastRun((prev) => ({
          ...prev,
          lastRunStatus: 'success',
          lastRunAt:     new Date().toISOString(),
          lastRunCount:  saved,
        }))

        // 상세 진단 정보 구성
        const lines: string[] = []
        if (data.envStatus) {
          const e = data.envStatus
          if (!e.GEMINI_API_KEY)           lines.push('⚠ GEMINI_API_KEY 미설정')
          if (!e.NAVER_NEWS_CLIENT_ID)     lines.push('⚠ NAVER_NEWS_CLIENT_ID 미설정')
          if (!e.NAVER_NEWS_CLIENT_SECRET) lines.push('⚠ NAVER_NEWS_CLIENT_SECRET 미설정')
        }
        lines.push(`RSS/API 수집: ${totalFetched}건 → 신규: ${collected}건 → AI처리: ${data.processed ?? 0}건 → 저장: ${saved}건`)
        if (data.sourceStats) {
          data.sourceStats.forEach(s => {
            lines.push(`  • ${s.name}: ${s.fetched}건${s.error ? ` (오류: ${s.error})` : ''}`)
          })
        }
        setCollectDetail(lines.join('\n'))
      } else {
        setCollectMsg(`✗ ${data.error ?? '수집 실패'}`)
        if (data.envStatus) {
          const e = data.envStatus
          const missing = [
            !e.GEMINI_API_KEY && 'GEMINI_API_KEY',
            !e.NAVER_NEWS_CLIENT_ID && 'NAVER_NEWS_CLIENT_ID',
            !e.NAVER_NEWS_CLIENT_SECRET && 'NAVER_NEWS_CLIENT_SECRET',
          ].filter(Boolean)
          if (missing.length) setCollectDetail(`미설정 환경변수: ${missing.join(', ')}`)
        }
      }
    } catch {
      setCollectMsg('✗ 네트워크 오류')
    } finally {
      setCollecting(false)
      setTimeout(() => { setCollectMsg(''); setCollectDetail('') }, 15000)
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
  }

  return (
    <div className="space-y-6">

      {/* ── 마지막 실행 결과 ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">마지막 실행 결과</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-1">상태</p>
            <StatusBadge status={lastRun.lastRunStatus} />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">실행 시각</p>
            <p className="text-gray-700">
              {lastRun.lastRunAt
                ? new Date(lastRun.lastRunAt).toLocaleString('ko-KR')
                : '없음'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">저장된 기사</p>
            <p className="font-semibold text-[#1B3A6B]">
              {lastRun.lastRunCount != null ? `${lastRun.lastRunCount}건` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 수동 수집 버튼 ── */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleCollectNow}
          disabled={collecting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8922A] text-white text-sm font-semibold hover:bg-[#b07a20] disabled:opacity-50 transition-colors shadow-sm"
        >
          {collecting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              수집 중...
            </span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              지금 수집하기
            </>
          )}
        </button>
        {collectMsg && (
          <span className={`text-sm font-medium ${collectMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
            {collectMsg}
          </span>
        )}
      </div>

      {/* 소스별 상세 진단 */}
      {collectDetail && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">수집 진단 결과</p>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
            {collectDetail}
          </pre>
        </div>
      )}

      {/* ── 설정 폼 ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-5">
        <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">자동 수집 설정</h3>

        {/* 활성화 토글 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">자동 수집 활성화</p>
            <p className="text-xs text-gray-400 mt-0.5">비활성화 시 크론 트리거가 실행되어도 수집하지 않습니다.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" {...register('isEnabled')} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B3A6B]" />
          </label>
        </div>

        {/* 수집 시간 */}
        <div className={isEnabled ? '' : 'opacity-50 pointer-events-none'}>
          <label className="block text-sm font-medium text-gray-700 mb-2">수집 시간 (매일)</label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <select
                {...register('collectHour', { valueAsNumber: true })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{pad(i)}시</option>
                ))}
              </select>
              <select
                {...register('collectMinute', { valueAsNumber: true })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              >
                {[0, 10, 20, 30, 40, 50].map((m) => (
                  <option key={m} value={m}>{pad(m)}분</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-gray-400">(KST 기준)</span>
          </div>
          {(errors.collectHour || errors.collectMinute) && (
            <p className="text-xs text-red-500 mt-1">올바른 시간을 선택해주세요.</p>
          )}
        </div>

        {/* AI 제공자 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">AI 분석 제공자</label>
          <select
            {...register('aiProvider')}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 w-56"
          >
            <option value="gemini">Google Gemini (gemini-2.0-flash-lite)</option>
            <option value="openai">OpenAI (GPT-4o-mini)</option>
            <option value="claude">Claude (Anthropic)</option>
            <option value="none">AI 분석 사용 안 함</option>
          </select>
        </div>

        {/* AI 관련성 임계값 슬라이더 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI 관련도 임계값
            <span className="ml-2 px-2 py-0.5 rounded-full bg-[#1B3A6B]/10 text-[#1B3A6B] text-xs font-bold">
              {relevanceThreshold}점 이상
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            {...register('relevanceThreshold', { valueAsNumber: true })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1B3A6B]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0 (전체 수집)</span>
            <span>50 (권장)</span>
            <span>100 (매우 엄격)</span>
          </div>
          {errors.relevanceThreshold && (
            <p className="text-xs text-red-500 mt-1">{errors.relevanceThreshold.message}</p>
          )}
        </div>

        {/* 1회 최대 수집 건수 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">1회 최대 수집 건수</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={200}
              {...register('maxArticlesPerRun', { valueAsNumber: true })}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            />
            <span className="text-sm text-gray-400">건 (최대 200)</span>
          </div>
          {errors.maxArticlesPerRun && (
            <p className="text-xs text-red-500 mt-1">{errors.maxArticlesPerRun.message}</p>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? '저장 중...' : '설정 저장'}
          </button>
          {saveMsg && (
            <span className={`text-sm font-medium ${saveMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
