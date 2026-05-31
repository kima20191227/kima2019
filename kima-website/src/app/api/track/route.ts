import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ALLOWED_ORIGINS = [
  'https://kima2019.org',
  'https://www.kima2019.org',
  'http://localhost:3000',
]

function isAllowedOrigin(origin: string, request: NextRequest) {
  if (ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) return true

  try {
    const originUrl = new URL(origin)
    const requestHost = request.headers.get('host')

    if (requestHost && originUrl.host === requestHost) return true
    return originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  if (!isAllowedOrigin(origin, request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { path, referrer, userAgent } = body

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'path required' }, { status: 400 })
    }

    const ua = (userAgent ?? '').toLowerCase()
    const deviceType = /iphone|android|mobile|tablet|ipad/.test(ua) ? 'mobile' : 'desktop'

    // Vercel이 자동으로 추가하는 지역 헤더 활용
    const country = request.headers.get('x-vercel-ip-country') ?? null
    const region = request.headers.get('x-vercel-ip-country-region') ?? null

    await prisma.pageView.create({
      data: {
        path,
        referrer: referrer || null,
        userAgent: userAgent || null,
        deviceType,
        country,
        region,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[track] error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
