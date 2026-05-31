'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'

const ROLE_HIERARCHY = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 } as const

function hasRole(role: UserRole, required: keyof typeof ROLE_HIERARCHY) {
  return (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY[required]
}

const NAV = [
  { href: '/admin',               label: '대시보드',     icon: '🏠', exact: true,  minRole: 'OFFICER' as const },
  { href: '/admin/members',       label: '회원 관리',    icon: '👥', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/organizations', label: '전체 단체관리', icon: '🏢', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/categories',    label: '커뮤니티별 담당자 관리', icon: '📂', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/resources',     label: '자료 관리',    icon: '📄', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/events',        label: '일정 관리',    icon: '📅', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/leadership',     label: '임원단 관리',  icon: '👤', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/stories',       label: '현장스토리',   icon: '📖', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/legal',         label: '법령&제도',    icon: '§', exact: false, minRole: 'ADMIN'   as const },
  { href: '/admin/news',          label: '뉴스 관리',    icon: '📰', exact: false, minRole: 'ADMIN'   as const },
  { href: '/admin/columns',       label: '칼럼 관리',    icon: '✍️', exact: false, minRole: 'ADMIN'   as const },
  { href: '/admin/qna',           label: 'Q&A 관리',    icon: '💬', exact: false, minRole: 'ADMIN'   as const },
  { href: '/admin/forum-archives', label: '포럼·리스닝콜', icon: '🏛', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/email',         label: '메일 발송',    icon: '✉️', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/bulk-register', label: '회원 일괄등록', icon: '👤', exact: false, minRole: 'ADMIN'   as const },
  { href: '/admin/popups',        label: '팝업 관리',    icon: '🪟', exact: false, minRole: 'OFFICER' as const },
  { href: '/admin/stats',         label: '접속 통계',    icon: '📊', exact: false, minRole: 'OFFICER' as const },
]

interface Props {
  userRole: UserRole
}

export function AdminSidebar({ userRole }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const visibleNav = NAV.filter((item) => hasRole(userRole, item.minRole))

  const isActive = (item: (typeof NAV)[0]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const roleLabel = userRole === 'ADMIN' ? '관리자' : '임원'

  const NavLinks = () => (
    <nav className="space-y-1">
      {visibleNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(item)
              ? 'bg-[#C8922A] text-white'
              : 'text-gray-300 hover:bg-white/10 hover:text-white'
          )}
        >
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      {/* 모바일 토글 버튼 */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#1B3A6B] text-white shadow"
        onClick={() => setOpen((v) => !v)}
        aria-label="메뉴 열기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 모바일 오버레이 */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-60 bg-[#1B3A6B] z-40 flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-5 border-b border-white/10">
          <p className="text-white font-bold text-lg">KIMA</p>
          <p className="text-blue-200 text-xs mt-0.5">{roleLabel} 패널</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-blue-200 hover:text-white transition-colors"
          >
            ← 사이트로 돌아가기
          </Link>
        </div>
      </aside>
    </>
  )
}
