/**
 * 모바일 앱 JWT 인증 헬퍼
 *
 * NextAuth 세션 쿠키(웹) 또는 Bearer JWT(모바일 앱) 양쪽을 모두 수락합니다.
 * 기존 API Route에서 auth() 대신 getAuthUser()를 호출하면 두 방식 모두 지원됩니다.
 *
 * 환경변수: MOBILE_JWT_SECRET (최소 32바이트)
 *   생성: openssl rand -base64 32
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@prisma/client'
import type { NextRequest } from 'next/server'

// ─── 타입 ────────────────────────────────────────────────────────────────────

export interface MobileTokenPayload extends JWTPayload {
  userId: string
  email: string
  role: UserRole
  /** 정회원 만료일 ISO8601 — null이면 무기한 또는 비정회원 */
  expiresAt: string | null
  /** 'access' | 'refresh' */
  type: 'access' | 'refresh'
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: UserRole
  expiresAt: string | null
}

// ─── 내부 유틸 ────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('MOBILE_JWT_SECRET 환경변수가 설정되지 않았거나 32자 미만입니다.')
  }
  return new TextEncoder().encode(secret)
}

// ─── 토큰 발급 ────────────────────────────────────────────────────────────────

/**
 * Access Token 발급 (7일 만료)
 */
export async function signAccessToken(user: AuthUser): Promise<string> {
  const payload: Omit<MobileTokenPayload, keyof JWTPayload> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: user.expiresAt ?? null,
    type: 'access',
  }
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/**
 * Refresh Token 발급 (30일 만료)
 */
export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId, type: 'refresh' } as Omit<MobileTokenPayload, keyof JWTPayload>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

// ─── 토큰 검증 ────────────────────────────────────────────────────────────────

/**
 * JWT 문자열 검증 → 페이로드 반환. 실패 시 null.
 */
export async function verifyToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as MobileTokenPayload
  } catch {
    return null
  }
}

// ─── 통합 인증 함수 ───────────────────────────────────────────────────────────

/**
 * NextAuth 세션 쿠키 또는 Authorization: Bearer <jwt> 둘 다 처리.
 *
 * 기존 API Route에서 다음 패턴으로 대체 가능:
 *   const user = await getAuthUser(request)
 *   if (!user) return NextResponse.json({ error: '...' }, { status: 401 })
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // 1) Bearer JWT 시도 (모바일 앱)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    if (!payload || payload.type !== 'access') return null

    // DB에서 최신 정보 조회 (역할 변경 즉시 반영)
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, expiresAt: true },
    }).catch(() => null)
    if (!dbUser) return null

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      expiresAt: dbUser.expiresAt?.toISOString() ?? null,
    }
  }

  // 2) NextAuth 세션 쿠키 (웹)
  const session = await auth()
  if (!session?.user?.id) return null

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: session.user.role,
    expiresAt: session.user.expiresAt ?? null,
  }
}

// ─── 정회원 유효성 검사 ───────────────────────────────────────────────────────

/**
 * PREMIUM 역할이면서 아직 만료되지 않은 경우에만 true.
 * OFFICER·ADMIN은 만료 개념 없이 항상 true.
 */
export function isActivePremium(user: AuthUser): boolean {
  if (user.role === 'ADMIN' || user.role === 'OFFICER') return true
  if (user.role !== 'PREMIUM') return false
  if (!user.expiresAt) return true
  return new Date(user.expiresAt) > new Date()
}
