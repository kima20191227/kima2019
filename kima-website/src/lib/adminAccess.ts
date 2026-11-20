import { prisma } from '@/lib/prisma'

// 관리자(ADMIN)가 임원(OFFICER)에게 개별로 열어 줄 수 있는 관리자 메뉴.
// - 기본적으로 이 메뉴들은 관리자 전용이다. 임원은 ADMIN이 체크한 메뉴만 쓸 수 있다.
// - 회원 관리(등급 변경·삭제·비밀번호 초기화)와 회원 일괄등록은 권한 상승 위험이 있어 목록에 넣지 않는다 (ADMIN 전용 유지).
// - 새 메뉴를 열 수 있게 하려면 여기에 추가하고, 해당 API/페이지의 권한 검사를 hasAdminMenu(session, key)로 바꾼다.
export const GRANTABLE_ADMIN_MENUS = [
  { key: 'organizations', label: '전체 단체관리', href: '/admin/organizations' },
  { key: 'categories', label: '커뮤니티별 담당자 관리', href: '/admin/categories' },
  { key: 'resources', label: '자료 관리', href: '/admin/resources' },
  { key: 'legal', label: '법령&제도', href: '/admin/legal' },
  { key: 'news', label: '뉴스 관리', href: '/admin/news' },
  { key: 'columns', label: '칼럼 관리', href: '/admin/columns' },
  { key: 'qna', label: 'Q&A 관리', href: '/admin/qna' },
  { key: 'email', label: '메일 발송', href: '/admin/email' },
  { key: 'popups', label: '팝업 관리', href: '/admin/popups' },
] as const

export type AdminMenuKey = (typeof GRANTABLE_ADMIN_MENUS)[number]['key']

export const ADMIN_MENU_KEYS = GRANTABLE_ADMIN_MENUS.map((m) => m.key) as [AdminMenuKey, ...AdminMenuKey[]]

export function isAdminMenuKey(value: string): value is AdminMenuKey {
  return (ADMIN_MENU_KEYS as string[]).includes(value)
}

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
