import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAllowedOrigin } from '@/lib/allowedOrigin'

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
