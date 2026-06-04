'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const SLIDES = [
  {
    id: 2,
    type: 'image' as const,
    image: 'https://i.imgur.com/f3hqL8I.jpg',
    badge: '제4차 KIMA 포럼 2025',
    title: '전국 이주민 사역자가\n한 자리에',
    desc: '전국 각지의 이주민 선교 사역자들이 모여 소통하고 협력하며 이주민 선교의 미래를 함께 그립니다.',
  },
  {
    id: 3,
    type: 'image' as const,
    image: 'https://i.imgur.com/fLwoAjH.jpg',
    badge: 'KIMA Listening Call & Forum',
    title: '현장의 목소리를\n함께 나누다',
    desc: '분과별 토의와 분기별 리스닝콜을 통해 전국 사역자들이 현장 경험과 지혜를 나눕니다.',
  },
  {
    id: 4,
    type: 'image' as const,
    image: 'https://i.imgur.com/pGWksJM.jpg',
    badge: '400만 이주민 시대를 향한 KIMA의 비전',
    title: '연결·기록·가시화·\n후원으로 이어주는',
    desc: '다양한 언어권과 지역의 사역자들이 협력하여 이주민들에게 복음과 사랑을 전합니다.',
  },
  {
    id: 1,
    type: 'text' as const,
    badge: 'Korea Immigrants Missions Association',
    title: '이주민과 함께,\n한국 교회가 하나로',
    desc: '전국 이주민 사역 단체를 연결하고, 현장을 기록하며, 후원이 필요한 곳으로 자원이 흐르게 하는 플랫폼입니다.',
  },
]

export function HeroCarousel({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, paused])

  const slide = SLIDES[current]

  return (
    <section
      className="relative overflow-hidden h-[clamp(420px,56vw,640px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 배경 */}
      {slide.type === 'image' ? (
        <>
          <Image
            key={slide.id}
            src={slide.image}
            alt={slide.badge}
            fill
            className="object-cover transition-opacity duration-700"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#1B3A6B]">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_50%,#C8922A_0%,transparent_50%),radial-gradient(circle_at_80%_20%,#fff_0%,transparent_40%)]" />
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-center">
        <div className="max-w-2xl text-white">
          <p className="text-[#C8922A] font-semibold text-sm uppercase tracking-widest mb-4">
            {slide.badge}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 sm:mb-6 whitespace-pre-line drop-shadow-sm">
            {slide.title}
          </h1>
          <p className="text-base sm:text-lg text-blue-100 leading-relaxed mb-7 sm:mb-10 max-w-xl drop-shadow-sm">
            {slide.desc}
          </p>

          {/* CTA는 텍스트 슬라이드에만 */}
          {slide.type === 'text' && (
            <div className="flex flex-wrap gap-4">
              {isLoggedIn ? (
                <Link
                  href="/community"
                  className="inline-flex items-center px-7 py-3 rounded-lg bg-[#C8922A] text-white font-semibold hover:bg-[#b07e24] transition-colors"
                >
                  커뮤니티 바로가기
                </Link>
              ) : (
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-7 py-3 rounded-lg bg-[#C8922A] text-white font-semibold hover:bg-[#b07e24] transition-colors"
                >
                  회원가입 하기
                </Link>
              )}
              <Link
                href="/directory"
                className="inline-flex items-center px-7 py-3 rounded-lg border border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                사역단체 전국지도 보기
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Prev / Next 버튼 */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
        aria-label="이전 슬라이드"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
        aria-label="다음 슬라이드"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 점 인디케이터 */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>

      {/* 슬라이드 카운터 */}
      <div className="absolute top-4 right-4 text-white/60 text-xs font-medium">
        {current + 1} / {SLIDES.length}
      </div>
    </section>
  )
}
