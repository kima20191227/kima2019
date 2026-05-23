'use client'

import { useEffect, useRef, useState } from 'react'

declare global { interface Window { kakao: any } }

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || 'c3db9b11452db7f5a8e2587ced3ab66e'
let kakaoScriptPromise: Promise<void> | null = null

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

interface Props {
  lat: number
  lng: number
  name: string
}

export function OrgDetailMap({ lat, lng, name }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    loadKakaoScript()
      .then(() => {
        if (cancelled || !containerRef.current) return
        window.kakao.maps.load(() => {
          if (cancelled || !containerRef.current) return
          const pos = new window.kakao.maps.LatLng(lat, lng)
          const map = new window.kakao.maps.Map(containerRef.current, {
            center: pos,
            level: 5,
          })

          // Marker
          const marker = new window.kakao.maps.Marker({ position: pos, map })

          // Info window
          const iw = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:8px 12px;font-size:13px;font-weight:700;color:#1B3A6B;font-family:'Noto Sans KR',sans-serif;white-space:nowrap">${name}</div>`,
          })
          iw.open(map, marker)
        })
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })

    return () => { cancelled = true }
  }, [lat, lng, name])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full rounded-xl" />
}
