import { NextRequest, NextResponse } from 'next/server'
import { cfEnv } from '@/lib/cfEnv'
import { runLegalSourceSync } from '@/lib/legalSourceSync'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const token = cfEnv('CRON_SECRET_TOKEN') ?? cfEnv('CRON_SECRET') ?? ''
  const authHeader = request.headers.get('authorization')

  if (!token || authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  try {
    const result = await runLegalSourceSync()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[sync-legal-sources] 실행 오류:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
