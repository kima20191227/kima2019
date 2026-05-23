'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Organization } from '@prisma/client'

declare global {
  interface Window { kakao: any }
}

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || 'c3db9b11452db7f5a8e2587ced3ab66e'
let kakaoScriptPromise: Promise<void> | null = null

function loadKakaoScript(): Promise<void> {
  if (kakaoScriptPromise) return kakaoScriptPromise

  kakaoScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('SSR')); return }
    if (window.kakao?.maps) { resolve(); return }

    const existing = document.querySelector('script[data-kakao-map]')
    if (existing) {
      // 이미 추가된 스크립트가 로드 완료되길 기다림
      const poll = () => { window.kakao?.maps ? resolve() : setTimeout(poll, 50) }
      poll(); return
    }

    const script = document.createElement('script')
    script.setAttribute('data-kakao-map', 'true')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Kakao Maps SDK 로드 실패'))
    document.head.appendChild(script)
  })

  return kakaoScriptPromise
}

interface MapComponentProps {
  organizations: Organization[]
  selectedId?: string
  onSelect?: (id: string) => void
  onHover?: (id: string | undefined) => void
  showContact?: boolean
}

export function MapComponent({ organizations, selectedId, onSelect, onHover, showContact }: MapComponentProps) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<any>(null)
  const overlaysRef     = useRef<Map<string, any>>(new Map())
  const infoOverlayRef  = useRef<any>(null)
  const hoverLabelRef   = useRef<any>(null)
  const onSelectRef     = useRef(onSelect)
  const onHoverRef      = useRef(onHover)
  const showContactRef  = useRef(showContact)
  const prevOrgsKeyRef  = useRef<string>('')
  onSelectRef.current  = onSelect
  onHoverRef.current   = onHover
  showContactRef.current = showContact

  const [ready, setReady]           = useState(false)
  const [sdkError, setSdkError]     = useState<string | null>(null)
  // 모바일(768px 미만)에서는 버튼 클릭 후 로드, 데스크탑은 즉시 로드
  const [mapRequested, setMapRequested] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )

  // ── SDK 로드 → 지도 초기화 ───────────────────────────────────
  useEffect(() => {
    if (!mapRequested || !containerRef.current) return
    let cancelled = false

    loadKakaoScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        window.kakao.maps.load(() => {
          if (cancelled || !containerRef.current) return
          const map = new window.kakao.maps.Map(containerRef.current, {
            center: new window.kakao.maps.LatLng(36.5, 127.9),
            level: 8,
          })
          mapRef.current = map

          window.kakao.maps.event.addListener(map, 'click', () => {
            infoOverlayRef.current?.setMap(null)
            infoOverlayRef.current = null
          })

          setReady(true)
        })
      })
      .catch((err: Error) => {
        if (!cancelled) setSdkError(err.message)
      })

    return () => { cancelled = true }
  }, [mapRequested])

  // ── 확장 팝업 표시 ────────────────────────────────────────────
  const showInfo = useCallback((org: Organization, pos: any) => {
    infoOverlayRef.current?.setMap(null)
    infoOverlayRef.current = null
    if (!mapRef.current) return

    const F = "font-family:'Noto Sans KR',sans-serif"

    // ── 카드 래퍼
    const wrap = document.createElement('div')
    wrap.style.cssText = [
      'background:white', 'border-radius:14px',
      'padding:16px', 'width:290px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.22)',
      'position:relative', F,
      'overflow-wrap:break-word', 'word-break:keep-all',
    ].join(';')

    // ── 헤더 (단체명 + 닫기)
    const header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px'

    const nameBlock = document.createElement('div')
    nameBlock.style.cssText = 'min-width:0;flex:1'
    const nameEl = document.createElement('p')
    nameEl.style.cssText = 'margin:0;font-weight:700;color:#1B3A6B;font-size:14px;line-height:1.5;word-break:keep-all;overflow-wrap:break-word'
    nameEl.textContent = org.name
    nameBlock.appendChild(nameEl)
    if (org.nameEn) {
      const nameEnEl = document.createElement('p')
      nameEnEl.style.cssText = 'margin:2px 0 0;font-size:11px;color:#9ca3af'
      nameEnEl.textContent = org.nameEn
      nameBlock.appendChild(nameEnEl)
    }

    const closeBtn = document.createElement('button')
    closeBtn.textContent = '✕'
    closeBtn.style.cssText = 'flex-shrink:0;background:#f3f4f6;border:none;color:#6b7280;cursor:pointer;font-size:12px;line-height:1;padding:4px 6px;border-radius:6px;margin-top:1px'
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      infoOverlayRef.current?.setMap(null)
      infoOverlayRef.current = null
    })
    header.appendChild(nameBlock)
    header.appendChild(closeBtn)
    wrap.appendChild(header)

    // ── 뱃지 (지역 + 유형)
    const badges = document.createElement('div')
    badges.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px'

    const mkBadge = (text: string, bg: string, color: string) => {
      const b = document.createElement('span')
      b.style.cssText = `display:inline-block;padding:2px 9px;border-radius:9999px;font-size:11px;font-weight:600;background:${bg};color:${color}`
      b.textContent = text
      return b
    }
    badges.appendChild(mkBadge(org.region, '#eff6ff', '#3b82f6'))
    if (org.type) badges.appendChild(mkBadge(org.type, '#fffbeb', '#d97706'))
    wrap.appendChild(badges)

    // ── 언어권 태그
    if (org.languages?.length > 0) {
      const tagRow = document.createElement('div')
      tagRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;margin-bottom:10px'
      const show = org.languages.slice(0, 5)
      show.forEach((lang) => {
        const t = document.createElement('span')
        t.style.cssText = 'padding:2px 8px;border-radius:9999px;font-size:10px;background:#f3f4f6;color:#6b7280'
        t.textContent = lang
        tagRow.appendChild(t)
      })
      if (org.languages.length > 5) {
        const more = document.createElement('span')
        more.style.cssText = 'padding:2px 8px;border-radius:9999px;font-size:10px;background:#f3f4f6;color:#9ca3af'
        more.textContent = `+${org.languages.length - 5}`
        tagRow.appendChild(more)
      }
      wrap.appendChild(tagRow)
    }

    // ── 소개
    if (org.description) {
      const desc = document.createElement('p')
      desc.style.cssText = 'margin:0 0 10px;font-size:11px;color:#6b7280;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden'
      desc.textContent = org.description
      wrap.appendChild(desc)
    }

    // ── 구분선
    const hr = document.createElement('div')
    hr.style.cssText = 'border-top:1px solid #f3f4f6;margin:0 0 10px'
    wrap.appendChild(hr)

    // ── 주소
    if (org.address) {
      const addrRow = document.createElement('div')
      addrRow.style.cssText = 'display:flex;gap:5px;align-items:flex-start;margin-bottom:6px'
      const icon = document.createElement('span')
      icon.style.cssText = 'font-size:11px;color:#9ca3af;flex-shrink:0;padding-top:1px'
      icon.textContent = '📍'
      const txt = document.createElement('span')
      txt.style.cssText = 'font-size:11px;color:#6b7280;line-height:1.6;word-break:keep-all;overflow-wrap:break-word'
      txt.textContent = org.address
      addrRow.appendChild(icon); addrRow.appendChild(txt)
      wrap.appendChild(addrRow)
    }

    // ── 연락처 (로그인 회원) or 안내
    if (showContactRef.current) {
      if (org.phone) {
        const phoneLink = document.createElement('a')
        phoneLink.href = `tel:${org.phone}`
        phoneLink.style.cssText = 'display:flex;gap:5px;align-items:center;font-size:11px;color:#1B3A6B;text-decoration:none;margin-bottom:4px'
        phoneLink.addEventListener('click', (e) => e.stopPropagation())
        const ic = document.createElement('span'); ic.textContent = '📞'
        const tv = document.createElement('span'); tv.textContent = org.phone
        phoneLink.appendChild(ic); phoneLink.appendChild(tv)
        wrap.appendChild(phoneLink)
      }
      if (org.email) {
        const emailLink = document.createElement('a')
        emailLink.href = `mailto:${org.email}`
        emailLink.style.cssText = 'display:flex;gap:5px;align-items:center;font-size:11px;color:#1B3A6B;text-decoration:none;margin-bottom:4px'
        emailLink.addEventListener('click', (e) => e.stopPropagation())
        const ic = document.createElement('span'); ic.textContent = '✉️'
        const tv = document.createElement('span'); tv.textContent = org.email
        emailLink.appendChild(ic); emailLink.appendChild(tv)
        wrap.appendChild(emailLink)
      }
      if (org.website) {
        const webLink = document.createElement('a')
        webLink.href = org.website
        webLink.target = '_blank'
        webLink.rel = 'noopener noreferrer'
        webLink.style.cssText = 'display:flex;gap:5px;align-items:center;font-size:11px;color:#1B3A6B;text-decoration:none;margin-bottom:4px'
        webLink.addEventListener('click', (e) => e.stopPropagation())
        const ic = document.createElement('span'); ic.textContent = '🌐'
        const tv = document.createElement('span'); tv.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px'; tv.textContent = org.website
        webLink.appendChild(ic); webLink.appendChild(tv)
        wrap.appendChild(webLink)
      }
    } else if (org.phone || org.email) {
      const note = document.createElement('p')
      note.style.cssText = 'margin:0 0 6px;font-size:10px;color:#9ca3af;padding:6px 8px;background:#f9fafb;border-radius:6px'
      note.textContent = '🔒 연락처는 로그인 후 확인할 수 있습니다'
      wrap.appendChild(note)
    }

    // ── 상세 보기 링크
    const footer = document.createElement('div')
    footer.style.cssText = 'margin-top:12px;text-align:right'
    const detailLink = document.createElement('a')
    detailLink.href = `/directory/${org.id}`
    detailLink.style.cssText = 'font-size:12px;font-weight:700;color:#1B3A6B;text-decoration:none;padding:5px 10px;background:#eff6ff;border-radius:7px'
    detailLink.textContent = '상세 보기 →'
    detailLink.addEventListener('click', (e) => e.stopPropagation())
    footer.appendChild(detailLink)
    wrap.appendChild(footer)

    // ── 말풍선 꼬리
    const tail = document.createElement('div')
    tail.style.cssText = 'position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:10px solid white;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.06))'
    wrap.appendChild(tail)

    const overlay = new window.kakao.maps.CustomOverlay({
      position: pos,
      content: wrap,
      xAnchor: 0.5,
      yAnchor: 1.15,
      zIndex: 20,
    })
    overlay.setMap(mapRef.current)
    infoOverlayRef.current = overlay
  }, [])

  // ── 마커 갱신 ─────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current) return

    // 기존 마커·인포·호버 레이블 제거
    overlaysRef.current.forEach((ov) => ov.setMap(null))
    overlaysRef.current.clear()
    infoOverlayRef.current?.setMap(null)
    infoOverlayRef.current = null
    hoverLabelRef.current?.setMap(null)
    hoverLabelRef.current = null

    // CSS keyframe 한 번만 주입
    if (!document.getElementById('kima-marker-style')) {
      const style = document.createElement('style')
      style.id = 'kima-marker-style'
      style.textContent = `
        @keyframes kima-blink {
          0%   { opacity: 1;    transform: scale(1);   }
          20%  { opacity: 0.1;  transform: scale(0.7); }
          40%  { opacity: 1;    transform: scale(1.3); }
          60%  { opacity: 0.1;  transform: scale(0.7); }
          80%  { opacity: 1;    transform: scale(1.2); }
          100% { opacity: 1;    transform: scale(1);   }
        }
      `
      document.head.appendChild(style)
    }

    const mappable = organizations.filter((o) => o.lat != null && o.lng != null)

    // organizations 실제 변경 여부 (필터 변경 vs 마커 클릭)
    const orgsKey = organizations.map((o) => o.id).join()
    const orgsChanged = orgsKey !== prevOrgsKeyRef.current
    prevOrgsKeyRef.current = orgsKey

    mappable.forEach((org, idx) => {
      const isSelected = org.id === selectedId
      const pos = new window.kakao.maps.LatLng(org.lat!, org.lng!)

      const dot = document.createElement('div')
      const size = isSelected ? 22 : 16
      const bg   = isSelected ? '#1B3A6B' : '#E84040'
      dot.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `background:${bg}`,
        'border:3px solid white',
        'border-radius:50%',
        'cursor:pointer',
        'box-shadow:0 2px 6px rgba(0,0,0,0.5)',
        'transition:transform 0.12s ease',
      ].join(';')

      // 깜빡임: 필터 변경 시에만 (마커 클릭 시엔 생략)
      if (orgsChanged) {
        const delay = Math.min(idx * 30, 600)
        dot.style.animation = `kima-blink 0.8s ease-out ${delay}ms 1 both`
        dot.addEventListener('animationend', () => { dot.style.animation = '' }, { once: true })
      }

      dot.addEventListener('mouseenter', () => {
        dot.style.transform = 'scale(1.4)'
        onHoverRef.current?.(org.id)
        hoverLabelRef.current?.setMap(null)
        const label = document.createElement('div')
        label.style.cssText = [
          'background:rgba(27,58,107,0.9)',
          'color:white',
          'border-radius:5px',
          'padding:4px 9px',
          'font-size:12px',
          'font-weight:600',
          'white-space:nowrap',
          "font-family:'Noto Sans KR',sans-serif",
          'pointer-events:none',
          'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
        ].join(';')
        label.textContent = org.name
        const hl = new window.kakao.maps.CustomOverlay({
          position: pos,
          content: label,
          xAnchor: 0.5,
          yAnchor: 1.8,
          zIndex: 15,
        })
        hl.setMap(mapRef.current)
        hoverLabelRef.current = hl
      })
      dot.addEventListener('mouseleave', () => {
        dot.style.transform = 'scale(1)'
        onHoverRef.current?.(undefined)
        hoverLabelRef.current?.setMap(null)
        hoverLabelRef.current = null
      })
      dot.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current?.(org.id)
        showInfo(org, pos)
      })

      const overlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: dot,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: isSelected ? 10 : 5,
      })
      overlay.setMap(mapRef.current)
      overlaysRef.current.set(org.id, overlay)
    })

    // bounds 조정: organizations가 바뀐 경우(필터 변경·초기 로드)에만 실행
    // selectedId만 바뀐 경우(마커 클릭)에는 현재 줌·위치 유지
    if (orgsChanged && mappable.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds()
      mappable.forEach((o) => bounds.extend(new window.kakao.maps.LatLng(o.lat!, o.lng!)))
      mapRef.current.setBounds(bounds)
    }

    // 선택된 단체 InfoWindow 표시 (panTo는 organizations 변경 시에만)
    if (selectedId) {
      const org = mappable.find((o) => o.id === selectedId)
      if (org) {
        const pos = new window.kakao.maps.LatLng(org.lat!, org.lng!)
        if (orgsChanged) mapRef.current.panTo(pos)
        showInfo(org, pos)
      }
    }
  }, [ready, organizations, selectedId, showInfo])

  if (!mapRequested) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 gap-3">
        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-sm text-gray-500">전국 단체 지도</p>
        <button type="button" onClick={() => setMapRequested(true)}
          className="px-5 py-2.5 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors">
          지도 보기
        </button>
      </div>
    )
  }

  if (sdkError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-6">
          <p className="text-sm font-medium text-gray-600">지도를 불러오지 못했습니다</p>
          <p className="text-xs text-gray-400 mt-1">{sdkError}</p>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}
