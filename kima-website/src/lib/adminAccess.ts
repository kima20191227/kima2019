import { prisma } from '@/lib/prisma'

import { ADMIN_MENU_KEYS, isAdminMenuKey, type AdminMenuKey } from '@/lib/adminMenus'

export { GRANTABLE_ADMIN_MENUS, ADMIN_MENU_KEYS, isAdminMenuKey } from '@/lib/adminMenus'
export type { AdminMenuKey } from '@/lib/adminMenus'

interface SessionLike {
  user?: { id?: string | null; role?: string | null } | null
}

/**
 * 사용자가 열 수 있는 개별 관리자 메뉴 키 목록.
 * 권한은 매번 DB에서 읽는다(세션 토큰에 넣지 않음) — 회수가 즉시 반영된다.
 * ADMIN은 전부, OFFICER는 부여받은 것만, 그 외는 없음.
 */
export async function getGrantedAdminMenus(session: SessionLike | null | undefined): Promise<AdminMenuKey[]> {
  const user = session?.user
  if (!user?.id) return []
  if (user.role === 'ADMIN') return [...ADMIN_MENU_KEYS]
  if (user.role !== 'OFFICER') return []
  const row = await prisma.user
    .findUnique({ where: { id: user.id }, select: { role: true, adminMenus: true } })
    .catch(() => null)
  // 세션의 역할이 오래됐을 수 있으므로 DB 역할도 다시 확인한다.
  if (!row || row.role === 'ADMIN') return row?.role === 'ADMIN' ? [...ADMIN_MENU_KEYS] : []
  if (row.role !== 'OFFICER') return []
  return row.adminMenus.filter(isAdminMenuKey)
}

export async function hasAdminMenu(session: SessionLike | null | undefined, key: AdminMenuKey): Promise<boolean> {
  if (session?.user?.role === 'ADMIN') return true
  return (await getGrantedAdminMenus(session)).includes(key)
}
