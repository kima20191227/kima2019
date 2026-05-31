import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse } from 'next/server'

const ROLE_HIERARCHY = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 } as const

function hasRole(userRole: string | undefined, required: keyof typeof ROLE_HIERARCHY) {
  if (!userRole) return false
  return (ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? 0) >= ROLE_HIERARCHY[required]
}

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // 회원 관리 · 단체 승인 → ADMIN 전용
  if (pathname.startsWith('/admin/members') || pathname.startsWith('/admin/organizations')) {
    if (!hasRole(userRole, 'ADMIN')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  // 나머지 관리 메뉴(자료·일정·카테고리) → OFFICER 이상
  } else if (pathname.startsWith('/admin')) {
    if (!hasRole(userRole, 'OFFICER')) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  if (pathname.startsWith('/legal/sources')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, req.url))
    }
  }

  if (pathname.startsWith('/resources')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}&notice=premium`, req.url))
    }
    if (!hasRole(userRole, 'PREMIUM')) {
      return NextResponse.redirect(new URL('/member/upgrade', req.url))
    }
  }

  if (pathname.startsWith('/community') || pathname.startsWith('/network')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, req.url))
    }
  }

  if (pathname.startsWith('/member')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${pathname}`, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/community/:path*', '/network/:path*', '/resources/:path*', '/member/:path*', '/legal/sources/:path*'],
}
