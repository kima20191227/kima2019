'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

type NavChild = { href: string; label: string; desc?: string; requiresPremium?: boolean }
type NavItem  = { href: string; label: string; children?: NavChild[] }

export type SessionUser = {
  name?: string | null
  email?: string | null
  role: string
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/about',
    label: '소개',
    children: [
      { href: '/about',            label: 'KIMA 소개',       desc: '한국이주민선교연합회 소개' },
      { href: '/about/greeting',   label: '상임대표 인사말',  desc: '남양규 상임대표 인사 및 약력' },
      { href: '/about/history',    label: '설립 연혁',        desc: '창립부터 현재까지 걸어온 길' },
      { href: '/about/vision',     label: '비전 & 사명',      desc: '4기 비전과 6대 실행계획' },
      { href: '/about/leadership', label: '임원단 소개',      desc: '4기 임원단 및 위원장' },
    ],
  },
  {
    href: '/network',
    label: '네트워크 사역',
    children: [
      { href: '/directory',             label: '사역단체 전국지도',    desc: '전국 이주민 사역 단체 지도' },
      { href: '/network/mission-map',   label: '유형별 단체 현황',     desc: '전국 이주민 선교 단체 통합 지도' },
      { href: '/network/listening',     label: '리스닝콜',             desc: '리스닝콜 안내 및 역대 기록' },
      { href: '/network/forum',         label: '포럼',                 desc: 'KIMA 이주민 선교 포럼 소개 및 기록' },
      { href: '/network/schedule',      label: 'KIMA 행사 일정',       desc: '리스닝콜·포럼 일정 및 참석 신청' },
    ],
  },
  {
    href: '/community',
    label: '사역별 커뮤니티',
    children: [
      { href: '/community',                label: '커뮤니티 홈',    desc: '전체 카테고리 게시판' },
      { href: '/community?tab=REGION',     label: '지역별',         desc: '서울경기·부산경남·광주전라 외' },
      { href: '/community?tab=LANGUAGE',   label: '언어권별',       desc: '베트남·네팔·몽골·중국 외' },
      { href: '/community?tab=TARGET',     label: '사역대상별',     desc: '이주노동자·유학생·결혼이민자 외' },
      { href: '/resources', label: '사역자료', desc: '정회원 전용 사역 자료 모음', requiresPremium: true },
    ],
  },
  {
    href: '/story',
    label: '현장스토리',
    children: [
      { href: '/story/news',        label: 'KIMA 뉴스',           desc: '외부 언론 기사·뉴스 링크 모음' },
      { href: '/story/media',       label: 'KIMA 행사&영상',      desc: 'KIMA 행사 사진·영상 갤러리' },
      { href: '/story/field',       label: '사역현장 이야기',      desc: '회원들이 올리는 현장 스토리' },
      { href: '/story/event-promo', label: '이주민사역&행사 홍보', desc: '이주민 사역 행사를 소개하고 알립니다' },
      { href: '/story/prayer',      label: '중보기도 요청',        desc: '긴급·일반 기도 제목 나눔' },
    ],
  },
  { href: '/donate', label: '후원' },
]

const ROLE_WEIGHT: Record<string, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

function roleToBadgeVariant(role: string): 'member' | 'premium' | 'officer' | 'admin' {
  const map: Record<string, 'member' | 'premium' | 'officer' | 'admin'> = {
    MEMBER: 'member', PREMIUM: 'premium', OFFICER: 'officer', ADMIN: 'admin',
  }
  return map[role] ?? 'member'
}

function PremiumModal({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-4xl mb-3">🔒</div>
        <h3 className="text-lg font-bold text-[#1B3A6B] mb-2">정회원 전용 메뉴</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          사역자료는 정회원(연 5만원) 이상만 이용할 수 있습니다.<br />
          정회원 신청 후 자료를 열람해 주세요.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            닫기
          </button>
          <button type="button" onClick={onUpgrade}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#C8922A] text-white text-sm font-semibold hover:bg-[#b07a20] transition-colors">
            정회원 신청
          </button>
        </div>
      </div>
    </div>
  )
}

export function HeaderClient({ user }: { user: SessionUser | null }) {
  const router = useRouter()
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [profileOpen,   setProfileOpen]   = useState(false)
  const [activeMenu,    setActiveMenu]    = useState<string | null>(null)
  const [showPremium,   setShowPremium]   = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const roleWeight = user?.role ? (ROLE_WEIGHT[user.role] ?? 1) : 0
  const isPremium  = roleWeight >= 2

  const openMenu   = (href: string) => { if (closeTimer.current) clearTimeout(closeTimer.current); setActiveMenu(href) }
  const closeMenu  = () => { closeTimer.current = setTimeout(() => setActiveMenu(null), 120) }
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }

  const handleChildClick = (child: NavChild) => {
    setActiveMenu(null)
    if (child.requiresPremium && !isPremium) { setShowPremium(true); return }
    router.push(child.href)
  }

  return (
    <>
      {showPremium && (
        <PremiumModal
          onClose={() => setShowPremium(false)}
          onUpgrade={() => { setShowPremium(false); router.push('/member/upgrade') }}
        />
      )}

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <div key={item.href} className="relative" onMouseEnter={() => openMenu(item.href)} onMouseLeave={closeMenu}>
            <Link
              href={item.href}
              className={`flex items-center gap-0.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeMenu === item.href ? 'text-[#1B3A6B] bg-blue-50' : 'text-gray-800 hover:text-[#1B3A6B] hover:bg-gray-50'
              }`}
            >
              {item.label}
              {item.children && item.children.length > 1 && (
                <svg className={`w-3.5 h-3.5 mt-0.5 transition-transform ${activeMenu === item.href ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </Link>

            {item.children && item.children.length > 1 && activeMenu === item.href && (
              <div className="absolute top-full left-0 pt-1 z-50" onMouseEnter={cancelClose} onMouseLeave={closeMenu}>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[220px]">
                  {item.children.filter((c) => !(c.requiresPremium && roleWeight < 2)).map((child) => (
                    <button key={child.href + child.label} type="button"
                      onClick={() => handleChildClick(child)}
                      className="w-full text-left flex flex-col px-4 py-2.5 hover:bg-blue-50 transition-colors group">
                      <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B3A6B] flex items-center gap-1.5">
                        {child.label}
                        {child.requiresPremium && !isPremium && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">정회원</span>
                        )}
                      </span>
                      {child.desc && <span className="text-xs text-gray-400 mt-0.5">{child.desc}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Auth area */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button type="button" onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#1B3A6B] transition-colors">
              <span className="hidden sm:block">{user.name ?? user.email}</span>
              <Badge variant={roleToBadgeVariant(user.role)} />
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
                onMouseLeave={() => setProfileOpen(false)}>
                <Link href="/member/mypage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setProfileOpen(false)}>
                  내 프로필
                </Link>
                {(user.role === 'ADMIN' || user.role === 'OFFICER') && (
                  <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setProfileOpen(false)}>
                    {user.role === 'ADMIN' ? '관리자 메뉴' : '임원 메뉴'}
                  </Link>
                )}
                <hr className="my-1 border-gray-100" />
                <button type="button" onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-[#1B3A6B] font-medium transition-colors">
              로그인
            </Link>
            <Link href="/auth/register"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors">
              회원가입
            </Link>
          </>
        )}

        {/* Mobile hamburger */}
        <button type="button" className="md:hidden p-2 text-gray-600 hover:text-[#1B3A6B]"
          onClick={() => setMobileOpen(!mobileOpen)} aria-label="메뉴">
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 py-2 col-span-full">
          {NAV_ITEMS.map((item) => {
            const hasChildren = item.children && item.children.length > 1
            const expanded    = mobileExpanded === item.href
            return (
              <div key={item.href}>
                <div className="flex items-center justify-between">
                  <Link href={item.href}
                    className="flex-1 px-3 py-2.5 text-sm font-semibold text-gray-800 hover:text-[#1B3A6B]"
                    onClick={() => { if (!hasChildren) setMobileOpen(false) }}>
                    {item.label}
                  </Link>
                  {hasChildren && (
                    <button type="button" className="px-3 py-2.5 text-gray-400"
                      onClick={() => setMobileExpanded(expanded ? null : item.href)}
                      aria-label={expanded ? '접기' : '펼치기'}>
                      <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
                {hasChildren && expanded && (
                  <div className="bg-gray-50 rounded-lg mx-3 mb-1">
                    {item.children!.filter((c) => !(c.requiresPremium && roleWeight < 2)).map((child) => (
                      <button key={child.href + child.label} type="button"
                        className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-[#1B3A6B] border-b border-gray-100 last:border-0"
                        onClick={() => {
                          setMobileOpen(false); setMobileExpanded(null)
                          if (child.requiresPremium && !isPremium) { setShowPremium(true); return }
                          router.push(child.href)
                        }}>
                        <span className="w-1 h-1 rounded-full bg-[#C8922A] shrink-0" />
                        {child.label}
                        {child.requiresPremium && !isPremium && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium ml-1">정회원</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {!user && (
            <Link href="/auth/register" className="block mx-3 mt-2 px-3 py-2 text-sm text-[#1B3A6B] font-medium"
              onClick={() => setMobileOpen(false)}>
              회원가입
            </Link>
          )}
        </div>
      )}
    </>
  )
}
