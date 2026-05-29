import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

/**
 * POST /api/admin/collect-now
 * 수동 뉴스 수집 트리거 — /api/cron/collect-news를 내부 호출
 * request.headers.get('host')로 서버 주소를 동적 판별 (로컬/운영 자동 대응)
 */
export async function POST(request: NextRequest) {
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
    // 요청 헤더의 host로 올바른 내부 URL 구성 (localhost:3001, localhost:3000, kima2019.org 모두 대응)
    const host     = request.headers.get('host') ?? 'localhost:3000'
    const isLocal  = host.includes('localhost') || host.includes('127.0.0.1')
    const protocol = isLocal ? 'http' : 'https'
    const internalUrl = `${protocol}://${host}/api/cron/collect-news`

    const res = await fetch(internalUrl, {
      method:  'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    // fetch 자체는 성공했지만 JSON이 아닌 HTML이 올 수 있으므로 text 먼저 읽기
    const text = await res.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      // HTML 에러 페이지 등 JSON이 아닌 경우
      return NextResponse.json(
        { error: `수집 서버 응답 오류 (${res.status}): ${text.slice(0, 200)}` },
        { status: res.status || 500 },
      )
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { error?: string }).error ?? '수집 중 오류가 발생했습니다.' },
        { status: res.status },
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
