/**
 * GET /api/cron/collect-news
 * 이주민·다문화 뉴스 자동 수집 크론 엔드포인트
 */
import { NextRequest, NextResponse } from 'next/server'
import { runNewsCollection } from '@/lib/collectNews'

export async function GET(request: NextRequest) {
  const token = process.env.CRON_SECRET_TOKEN ?? process.env.CRON_SECRET ?? ''
  const authHeader = request.headers.get('authorization')
  if (!token || authHeader !== `Bearer ${token}`) {
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
