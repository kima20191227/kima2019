/**
 * GET /api/cron/collect-news
 * 이주민 관련 뉴스 자동 수집 cron endpoint.
 */
import { NextRequest, NextResponse } from 'next/server'
import { runNewsCollection } from '@/lib/collectNews'
import { cfEnv } from '@/lib/cfEnv'

export const runtime = 'nodejs'
export const maxDuration = 60

function getAllowedCronTokens(): string[] {
  return [
    cfEnv('CRON_SECRET'),
    cfEnv('CRON_SECRET_TOKEN'),
  ].filter((value): value is string => !!value)
}

export async function GET(request: NextRequest) {
  const tokens = getAllowedCronTokens()
  const authHeader = request.headers.get('authorization')
  if (tokens.length === 0 || !tokens.some((token) => authHeader === `Bearer ${token}`)) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const result = await runNewsCollection()
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[collect-news] 실행 오류:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
