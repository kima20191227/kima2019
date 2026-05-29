import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { runNewsCollection } from '@/lib/collectNews'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

/**
 * POST /api/admin/collect-now
 * 수동 뉴스 수집 트리거 — runNewsCollection()을 직접 호출
 * (self-referential fetch 제거 → Cloudflare env 바인딩 정상 작동)
 */
export async function POST() {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  try {
    const result = await runNewsCollection()
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
