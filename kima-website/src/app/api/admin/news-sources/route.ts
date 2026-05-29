import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

const sourceSchema = z.object({
  name:            z.string().min(1).max(100),
  url:             z.string().url(),
  rssUrl:          z.string().url().nullable().optional(),
  apiType:         z.enum(['rss', 'naver', 'scraping']).default('rss'),
  isEnabled:       z.boolean().default(true),
  keywords:        z.array(z.string()).default([]),
  defaultCategory: z.enum(['LAW','STATISTICS','MULTICULTURAL','MIGRANT_WORKER','STUDENT','OTHER']).default('OTHER'),
  order:           z.number().int().default(0),
})

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  const sources = await prisma.newsSource.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json({ sources })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const parsed = sourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }
    const dup = await prisma.newsSource.findUnique({ where: { name: parsed.data.name } })
    if (dup) return NextResponse.json({ error: '이미 사용 중인 소스명입니다.' }, { status: 409 })

    const source = await prisma.newsSource.create({ data: parsed.data })
    return NextResponse.json({ source }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '소스 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
