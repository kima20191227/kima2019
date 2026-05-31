'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EVENT_TYPES } from '@/lib/eventTypes'

export interface CalendarEvent {
  id: string
  title: string
  type: string
  scheduledAt: string
  description: string | null
  location: string | null
  zoomUrl: string | null
  maxAttendees: number | null
  attendeeCount: number
}

interface Props {
  events: CalendarEvent[]
  isLoggedIn: boolean
  userRole?: string | null
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const TYPE_STYLES: Record<string, { label: string; dot: string; badge: string }> = {
  LISTENING_CALL:  { label: '리스닝콜',     dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700' },
  FORUM:           { label: '포럼',          dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
  ZOOM_MEETING:    { label: '줌 미팅',       dot: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-700' },
  EVENT:           { label: '행사',          dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  REGION_MEETING:  { label: '지역별모임',    dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
  MINISTRY_MEETING:{ label: '사역권별 모임', dot: 'bg-sky-500',    badge: 'bg-sky-100 text-sky-700' },
  OFFICER_MEETING: { label: '임원회의',      dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
  ETC:             { label: '기타',          dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600' },
}

function typeInfo(type: string) {
  return TYPE_STYLES[type] ?? { label: type, dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
}

function formatDate(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('ko-KR', opts)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate()
}

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'LISTENING_CALL',
  scheduledAt: '',
  zoomUrl: '',
  location: '',
  maxAttendees: '',
}

export function ScheduleCalendar({ events, isLoggedIn, userRole }: Props) {
  const router = useRouter()
  const today = new Date()
  const [mounted, setMounted] = useState(false)
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(events)
  const [viewYear, setViewYear]       = useState(today.getFullYear())
  const [viewMonth, setViewMonth]     = useState(today.getMonth()) // 0-indexed
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Officer-only registration form state
  const canManage = userRole === 'ADMIN' || userRole === 'OFFICER'
  const [formOpen, setFormOpen]       = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [formError, setFormError]     = useState('')
  const [isPending, startTransition]  = useTransition()

  useEffect(() => {
    setLocalEvents(events)
  }, [events])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Build calendar grid for current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay  = new Date(viewYear, viewMonth + 1, 0)
    const startOffset = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d))
    }
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewYear, viewMonth])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of localEvents) {
      const d = new Date(ev.scheduledAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map
  }, [localEvents])

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const listEvents = useMemo(() => {
    if (selectedDate) {
      return (eventsByDay.get(dayKey(selectedDate)) ?? []).sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    }
    return [...localEvents].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
  }, [selectedDate, eventsByDay, localEvents])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDate(null)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDate(null)
  }

  const goToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setSelectedDate(null)
  }

  const setField = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const handleRegister = () => {
    if (!form.title.trim() || !form.scheduledAt) {
      setFormError('제목과 일시는 필수입니다.')
      return
    }
    setFormError('')
    startTransition(async () => {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          type: form.type,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          zoomUrl: form.zoomUrl || undefined,
          location: form.location || undefined,
          maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error ?? '등록에 실패했습니다.')
        return
      }
      // Optimistic add
      const created = data.event
      const newEvent: CalendarEvent = {
        id: created.id,
        title: created.title,
        type: created.type,
        scheduledAt: typeof created.scheduledAt === 'string'
          ? created.scheduledAt
          : new Date(created.scheduledAt).toISOString(),
        description: created.description ?? null,
        location: created.location ?? null,
        zoomUrl: isLoggedIn ? (created.zoomUrl ?? null) : null,
        maxAttendees: created.maxAttendees ?? null,
        attendeeCount: 0,
      }
      setLocalEvents((prev) => [...prev, newEvent])
      setForm(EMPTY_FORM)
      setFormOpen(false)
      router.refresh()
    })
  }

  const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]'

  if (!mounted) {
    return (
      <div className="flex flex-col lg:flex-row gap-6" aria-busy="true">
        <div className="lg:w-[420px] shrink-0">
          <div className="h-[520px] rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-14 rounded-t-2xl bg-[#1B3A6B]" />
            <div className="grid grid-cols-7 gap-px p-5">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div key={idx} className="aspect-square rounded-md bg-gray-100" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-44 rounded-xl border border-gray-100 bg-white shadow-sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── 왼쪽: 캘린더 ── */}
      <div className="lg:w-[420px] shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#1B3A6B] text-white">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="이전 달"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <p className="font-bold text-base">
                {viewYear}년 {viewMonth + 1}월
              </p>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="다음 달"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 오늘 버튼 */}
          <div className="px-5 py-2 border-b border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={goToday}
              className="text-xs text-[#1B3A6B] hover:underline"
            >
              오늘로
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`text-center text-xs font-semibold py-2 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square border-b border-r border-gray-50" />
              }

              const key = dayKey(day)
              const dayEvents = eventsByDay.get(key) ?? []
              const isToday    = isSameDay(day, today)
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const isSun      = day.getDay() === 0
              const isSat      = day.getDay() === 6
              const isOtherMonth = day.getMonth() !== viewMonth

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 min-h-[52px] border-b border-r border-gray-50 transition-colors text-left
                    ${isSelected ? 'bg-[#1B3A6B]/8' : 'hover:bg-gray-50'}
                    ${isOtherMonth ? 'opacity-30' : ''}
                  `}
                >
                  <span
                    className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-0.5
                      ${isToday ? 'bg-[#C8922A] text-white font-bold' : ''}
                      ${isSelected && !isToday ? 'bg-[#1B3A6B] text-white' : ''}
                      ${!isToday && !isSelected && isSun ? 'text-red-400' : ''}
                      ${!isToday && !isSelected && isSat ? 'text-blue-400' : ''}
                      ${!isToday && !isSelected && !isSun && !isSat ? 'text-gray-700' : ''}
                    `}
                  >
                    {day.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center px-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-1.5 h-1.5 rounded-full ${typeInfo(ev.type).dot}`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-gray-400">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* 범례 */}
          <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-3">
            {Object.entries(TYPE_STYLES).map(([, { label, dot }]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 오른쪽: 일정 등록 폼 + 이벤트 리스트 ── */}
      <div className="flex-1 min-w-0">

        {/* 임원/관리자 일정 등록 */}
        {canManage && (
          <div className="mb-4">
            {!formOpen ? (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                일정 등록
              </button>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">새 일정 등록</h3>
                  <button
                    type="button"
                    onClick={() => { setFormOpen(false); setFormError(''); setForm(EMPTY_FORM) }}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕ 닫기
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">제목 *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      placeholder="일정 제목"
                      className={inputClass}
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">유형</label>
                    <select
                      title="유형"
                      value={form.type}
                      onChange={(e) => setField('type', e.target.value)}
                      className={inputClass}
                      disabled={isPending}
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">일시 *</label>
                    <input
                      title="일시"
                      type="datetime-local"
                      value={form.scheduledAt}
                      onChange={(e) => setField('scheduledAt', e.target.value)}
                      className={inputClass}
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">장소</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setField('location', e.target.value)}
                      placeholder="예: 오륜교회 그레이스홀"
                      className={inputClass}
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Zoom URL</label>
                    <input
                      type="url"
                      value={form.zoomUrl}
                      onChange={(e) => setField('zoomUrl', e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className={inputClass}
                      disabled={isPending}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">최대 참석 인원</label>
                    <input
                      type="number"
                      value={form.maxAttendees}
                      onChange={(e) => setField('maxAttendees', e.target.value)}
                      placeholder="없으면 비워두기"
                      min="1"
                      className={inputClass}
                      disabled={isPending}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">설명</label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="간단한 설명 (선택)"
                      className={inputClass}
                      disabled={isPending}
                    />
                  </div>
                </div>

                {formError && <p className="text-sm text-red-500">{formError}</p>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
                  >
                    {isPending ? '등록 중…' : '등록'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormOpen(false); setFormError(''); setForm(EMPTY_FORM) }}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">
            {selectedDate
              ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`
              : '다가오는 일정'}
          </h2>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
            >
              전체 보기
            </button>
          )}
        </div>

        {listEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">
              {selectedDate ? '이 날은 예정된 일정이 없습니다.' : '현재 예정된 일정이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {listEvents.map((event) => {
              const info   = typeInfo(event.type)
              const isFull = event.maxAttendees != null && event.attendeeCount >= event.maxAttendees
              const isPast = new Date(event.scheduledAt) < today

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl border shadow-sm p-5 transition-colors ${
                    isPast ? 'border-gray-100 opacity-60' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${info.badge}`}>
                          {info.label}
                        </span>
                        {isFull && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            마감
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400">
                            종료
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900">{event.title}</p>
                      {event.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{event.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>
                          📅 {formatDate(event.scheduledAt, { month: 'long', day: 'numeric', weekday: 'short' })} {formatTime(event.scheduledAt)}
                        </span>
                        {event.location && <span>📍 {event.location}</span>}
                        <span>
                          👥 {event.attendeeCount}명
                          {event.maxAttendees ? ` / 정원 ${event.maxAttendees}명` : ''}
                        </span>
                        {isLoggedIn && event.zoomUrl && (
                          <a
                            href={event.zoomUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            🎥 Zoom 링크
                          </a>
                        )}
                      </div>
                    </div>

                    {!isPast && (
                      !isFull ? (
                        <Link
                          href={`/network/schedule/${event.id}/attend`}
                          className="shrink-0 px-4 py-2 rounded-xl bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] transition-colors"
                        >
                          참석 신청
                        </Link>
                      ) : (
                        <span className="shrink-0 px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium">
                          마감됨
                        </span>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!isLoggedIn && (
          <p className="text-center text-sm text-gray-400 mt-6">
            Zoom 링크는 로그인 후 확인 가능합니다.{' '}
            <a href="/auth/login" className="text-[#1B3A6B] hover:underline">로그인하기 →</a>
          </p>
        )}
      </div>
    </div>
  )
}
