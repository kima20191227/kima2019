import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

/**
 * POST /api/admin/collect-now
 * 수동 뉴스 수집 트리거 — /api/cron/collect-news를 내부 호출
 */
export async function POST() {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const token = process.env.CRON_SECRET_TOKEN ?? process.env.CRON_SECRET ?? ''
  if (!token) {
    return NextResponse.json(
      { error: 'CRON_SECRET_TOKEN 환경변수가 설정되지 않았습니다.' },
      { status: 500 },
    )
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const res = await fetch(`${siteUrl}/api/cron/collect-news`, {
      method:  'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? '수집 중 오류가 발생했습니다.', detail: data },
        { status: res.status },
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
