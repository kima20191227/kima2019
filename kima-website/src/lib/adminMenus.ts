// 클라이언트 컴포넌트에서도 쓰는 순수 상수 모듈 — prisma 등 서버 전용 코드를 import하지 말 것.
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
