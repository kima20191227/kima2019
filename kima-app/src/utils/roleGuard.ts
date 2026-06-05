import type { AccessLevel, User, UserRole } from '@/types'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  MEMBER: 1,
  PREMIUM: 2,
  OFFICER: 3,
  ADMIN: 4,
}

/** role 계층 비교: userRole이 requiredRole 이상이면 true */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * 정회원 활성 여부:
 *   - OFFICER, ADMIN → 만료 개념 없이 항상 true
 *   - PREMIUM이면서 expiresAt > 현재 시각 (또는 expiresAt null) → true
 *   - 그 외 → false
 */
export function isPremiumActive(user: Pick<User, 'role' | 'expiresAt'>): boolean {
  if (user.role === 'ADMIN' || user.role === 'OFFICER') return true
  if (user.role !== 'PREMIUM') return false
  if (!user.expiresAt) return true
  return new Date(user.expiresAt) > new Date()
}

/** 만료되었지만 과거에 PREMIUM이었던 경우 (만료 안내 표시용) */
export function isPremiumExpired(user: Pick<User, 'role' | 'expiresAt'>): boolean {
  if (user.role !== 'PREMIUM') return false
  if (!user.expiresAt) return false
  return new Date(user.expiresAt) <= new Date()
}

/**
 * 자료 접근 가능 여부 판단 (클라이언트 UX용 — 실제 보안은 서버에서 처리)
 *  PUBLIC  : 항상 true
 *  MEMBER  : 로그인 + MEMBER 이상
 *  PREMIUM : isPremiumActive(user) === true (OFFICER/ADMIN 포함)
 */
export function canAccessResource(
  user: User | null,
  accessLevel: AccessLevel,
): boolean {
  if (accessLevel === 'PUBLIC') return true
  if (!user) return false
  if (accessLevel === 'MEMBER') return hasRole(user.role, 'MEMBER')
  return isPremiumActive(user) // PREMIUM
}
