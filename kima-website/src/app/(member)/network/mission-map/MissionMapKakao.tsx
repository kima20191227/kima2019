'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

declare global {
  interface Window { kakao: any }
}

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || 'c3db9b11452db7f5a8e2587ced3ab66e'
let kakaoScriptPromise: Promise<void> | null = null

export interface GmfsnsOrg {
  id: number
  name: string
  type: string
  languages: string[]
  address: string
  phone: string
  email: string
  website: string
  description: string
  lat: number | null
  lng: number | null
}

interface Props {
  orgs: GmfsnsOrg[]
  selectedId?: number
  onSelect?: (id: number) => void
  onHover?: (id: number | undefined) => void
}

function loadKakaoScript(): Promise<void> {
  if (kakaoScriptPromise) return kakaoScriptPromise

  kakaoScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('SSR')); return }
    if (window.kakao?.maps) { resolve(); return }
    const existing = document.querySelector('script[data-kakao-map]')
    if (existing) {
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

export function MissionMapKakao({ orgs, selectedId, onSelect, onHover }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)
  const overlaysRef    = useRef<Map<string, any>>(new Map())
  const infoOverlayRef = useRef<any>(null)
  const hoverLabelRef  = useRef<any>(null)
  const onSelectRef    = useRef(onSelect)
  const onHoverRef     = useRef(onHover)
  const prevOrgsKeyRef = useRef<string>('')
  onSelectRef.current  = onSelect
  onHoverRef.current   = onHover

  const [ready, setReady]       = useState(false)
  const [sdkError, setSdkError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
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
      .catch((err: Error) => { if (!cancelled) setSdkError(err.message) })
    return () => { cancelled = true }
  }, [])

  const showInfo = useCallback((org: GmfsnsOrg, pos: any) => {
    infoOverlayRef.current?.setMap(null)
    infoOverlayRef.current = null
    if (!mapRef.current) return

    const F = "font-family:'Noto Sans KR',sans-serif"

    const wrap = document.createElement('div')
    wrap.style.cssText = [
      'background:white', 'border-radius:14px',
      'padding:16px', 'width:290px',
      'box-shadow:0 8px 32px rgba(0,0,0,0.22)',
      'position:relative', F,
      'overflow-wrap:break-word', 'word-break:keep-all',
    ].join(';')

    // Header
    const header = document.createElement('div')
    header.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px'
    const nameEl = document.createElement('p')
    nameEl.style.cssText = 'margin:0;font-weight:700;color:#1B3A6B;font-size:14px;line-height:1.5;word-break:keep-all;overflow-wrap:break-word;flex:1;min-width:0'
    nameEl.textContent = org.name
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '✕'
    closeBtn.style.cssText = 'flex-shrink:0;background:#f3f4f6;border:none;color:#6b7280;cursor:pointer;font-size:12px;line-height:1;padding:4px 6px;border-radius:6px;margin-top:1px'
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      infoOverlayRef.current?.setMap(null)
      infoOverlayRef.current = null
    })
    header.appendChild(nameEl)
    header.appendChild(closeBtn)
    wrap.appendChild(header)

    // Type badge
    if (org.type) {
      const badges = document.createElement('div')
      badges.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px'
      const b = document.createElement('span')
      b.style.cssText = 'display:inline-block;padding:2px 9px;border-radius:9999px;font-size:11px;font-weight:600;background:#fffbeb;color:#d97706'
      b.textContent = org.type
      badges.appendChild(b)
      wrap.appendChild(badges)
    }

    // Language tags
    if (org.languages?.length > 0) {
      const tagRow = document.createElement('div')
      tagRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:3px;margin-bottom:10px'
      org.languages.slice(0, 5).forEach((lang) => {
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

    // Description
    if (org.description) {
      const desc = document.createElement('p')
      desc.style.cssText = 'margin:0 0 10px;font-size:11px;color:#6b7280;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden'
      desc.textContent = org.description
      wrap.appendChild(desc)
    }

    // Divider
    const hr = document.createElement('div')
    hr.style.cssText = 'border-top:1px solid #f3f4f6;margin:0 0 10px'
    wrap.appendChild(hr)

    // Address
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

    // Contact info (always shown — OFFICER-only page)
    if (org.phone) {
      const a = document.createElement('a')
      a.href = `tel:${org.phone}`
      a.style.cssText = 'display:flex;gap:5px;align-items:center;font-size:11px;color:#1B3A6B;text-decoration:none;margin-bottom:4px'
      a.addEventListener('click', (e) => e.stopPropagation())
      const ic = document.createElement('span'); ic.textContent = '📞'
      const tv = document.createElement('span'); tv.textContent = org.phone
      a.appendChild(ic); a.appendChild(tv)
      wrap.appendChild(a)
    }
    if (org.email) {
      const a = document.createElement('a')
      a.href = `mailto:${org.email}`
      a.style.cssText = 'display:flex;gap:5px;align-items:center;font-size:11px;color:#1B3A6B;text-decoration:none;margin-bottom:4px'
      a.addEventListener('click', (e) => e.stopPropagation())
      const ic = document.createElement('span'); ic.textContent = '✉️'
      const tv = document.createElement('span'); tv.textContent = org.email
      a.appendChild(ic); a.appendChild(tv)
      wrap.appendChild(a)
    }
    if (org.website) {
      const a = document.createElement('a')
      a.href = org.website
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.style.cssText = 'display:flex;gap:5px;align-items:center;font-size:11px;color:#1B3A6B;text-decoration:none;margin-bottom:4px'
      a.addEventListener('click', (e) => e.stopPropagation())
      const ic = document.createElement('span'); ic.textContent = '🌐'
      const tv = document.createElement('span')
      tv.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px'
      tv.textContent = org.website
      a.appendChild(ic); a.appendChild(tv)
      wrap.appendChild(a)
    }


    // Tail
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

  useEffect(() => {
    if (!ready || !mapRef.current) return

    overlaysRef.current.forEach((ov) => ov.setMap(null))
    overlaysRef.current.clear()
    infoOverlayRef.current?.setMap(null)
    infoOverlayRef.current = null
    hoverLabelRef.current?.setMap(null)
    hoverLabelRef.current = null

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

    const mappable = orgs.filter((o) => o.lat != null && o.lng != null)
    const orgsKey = orgs.map((o) => o.id).join()
    const orgsChanged = orgsKey !== prevOrgsKeyRef.current
    prevOrgsKeyRef.current = orgsKey

    mappable.forEach((org, idx) => {
      const key = String(org.id)
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
      overlaysRef.current.set(key, overlay)
    })

    if (orgsChanged && mappable.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds()
      mappable.forEach((o) => bounds.extend(new window.kakao.maps.LatLng(o.lat!, o.lng!)))
      mapRef.current.setBounds(bounds)
    }

    if (selectedId != null) {
      const org = mappable.find((o) => o.id === selectedId)
      if (org) {
        const pos = new window.kakao.maps.LatLng(org.lat!, org.lng!)
        if (orgsChanged) mapRef.current.panTo(pos)
        showInfo(org, pos)
      }
    }
  }, [ready, orgs, selectedId, showInfo])

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
