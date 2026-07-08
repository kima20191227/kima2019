import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HIERARCHY = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 } as const

function hasRole(userRole: string | undefined, required: keyof typeof ROLE_HIERARCHY) {
  if (!userRole) return false
  return (ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] ?? 0) >= ROLE_HIERARCHY[required]
}

function getOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const forwardedProto = req.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`

  return req.nextUrl.origin
}

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl

  // kima2019.vercel.app → kima2019.org 리다이렉트
  const host = req.headers.get('host') ?? req.nextUrl.hostname
  const canonical = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? ''
  if (host.endsWith('.vercel.app') && canonical && !canonical.includes('.vercel.app')) {
    return NextResponse.redirect(`${canonical}${pathname}${req.nextUrl.search}`, { status: 301 })
  }

  // www.kima2019.org → kima2019.org 리다이렉트
  // (세션 쿠키가 www/비www 간에 공유되지 않아, 로그인은 성공해도
  //  리다이렉트 후 다른 호스트로 넘어가면 로그아웃 상태로 보이는 문제가 있었음.
  //  public/_redirects의 동일 규칙은 OpenNext 배포에서 /api/* 경로에 적용되지 않으므로
  //  실제로 요청을 가로채는 이 미들웨어에서 먼저 정규 호스트로 강제 리다이렉트한다.)
  if (host === 'www.kima2019.org') {
    return NextResponse.redirect(`https://kima2019.org${pathname}${req.nextUrl.search}`, { status: 308 })
  }

  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role
  const origin = getOrigin(req)

  // 단체 승인 → ADMIN 전용
  if (pathname.startsWith('/admin/organizations')) {
    if (!hasRole(userRole, 'ADMIN')) {
      return NextResponse.redirect(`${origin}/`)
    }
  // 나머지 관리 메뉴 → OFFICER 이상
  } else if (pathname.startsWith('/admin')) {
    if (!hasRole(userRole, 'OFFICER')) {
      return NextResponse.redirect(`${origin}/`)
    }
  }

  // 자료실: 접근 등급(PUBLIC/MEMBER/PREMIUM)은 페이지에서 직접 처리
  // 미들웨어 제한 없음 — 비로그인도 PUBLIC 자료 열람 가능

  // 커뮤니티: 글쓰기·수정만 로그인 필요, 읽기는 공개
  if (pathname.startsWith('/community')) {
    const isWriteOrEdit =
      pathname.endsWith('/write') ||
      /\/posts\/[^/]+\/edit$/.test(pathname)
    if (isWriteOrEdit && !isLoggedIn) {
      return NextResponse.redirect(`${origin}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }

  if (pathname.startsWith('/member')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(`${origin}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }

  if (pathname.startsWith('/network')) {
    // edit 페이지만 로그인 필요, 나머지는 비회원도 접근 가능
    if (pathname.endsWith('/edit') && !isLoggedIn) {
      return NextResponse.redirect(`${origin}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }

  // story 작성·수정은 로그인 필요
  if (pathname.startsWith('/story/') && (pathname.endsWith('/write') || pathname.endsWith('/edit'))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(`${origin}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }

  if (pathname === '/directory/register') {
    if (!isLoggedIn) {
      return NextResponse.redirect(`${origin}/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/resources/:path*',
    '/community/:path*',
    '/member/:path*',
    '/network/:path*',
    '/story/:path*',
    '/directory/register',
    // www → 비www 리다이렉트가 로그인(/auth, /api/auth)을 포함한 모든 경로에 적용되도록
    '/auth/:path*',
    '/api/auth/:path*',
    '/',
  ],
}
