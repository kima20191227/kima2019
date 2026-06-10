import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

const patchSchema = z.object({
  isEnabled:          z.boolean().optional(),
  aiProvider:         z.enum(['gemini', 'claude', 'openai', 'none']).optional(),
  relevanceThreshold: z.number().min(0).max(100).optional(),
  maxArticlesPerRun:  z.number().int().min(1).max(200).optional(),
})

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  try {
    const settings = await prisma.newsSettings.upsert({
      where:  { id: 1 },
      create: { id: 1 },
      update: {},
    })
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: '설정을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    const { relevanceThreshold, ...rest } = parsed.data
    const data: Record<string, unknown> = { ...rest }

    // relevanceThreshold: UI에서 0-100, DB에는 0.0-1.0 으로 저장
    if (relevanceThreshold !== undefined) {
      data.relevanceThreshold = relevanceThreshold / 100
    }

    const settings = await prisma.newsSettings.upsert({
      where:  { id: 1 },
      create: { id: 1, ...data },
      update: data,
    })
    return NextResponse.json({ settings })
  } catch {
    return NextResponse.json({ error: '설정 저장 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
