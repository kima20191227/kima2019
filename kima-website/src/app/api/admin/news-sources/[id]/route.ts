import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import { ensureDefaultNewsCategories } from '@/lib/newsCategories'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  rssUrl: z.string().url().nullable().optional(),
  apiType: z.enum(['rss', 'naver', 'scraping']).optional(),
  isEnabled: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  defaultCategory: z.string().min(1).max(40).optional(),
  order: z.number().int().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  const { id } = await params
  await ensureDefaultNewsCategories()
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }
  try {
    if (parsed.data.defaultCategory) {
      const category = await prisma.newsCategoryConfig.findUnique({ where: { key: parsed.data.defaultCategory } })
      if (!category) return NextResponse.json({ error: '존재하지 않는 뉴스 카테고리입니다.' }, { status: 400 })
    }
    const source = await prisma.newsSource.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ source })
  } catch {
    return NextResponse.json({ error: '소스 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }
  const { id } = await params
  try {
    await prisma.newsSource.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '소스 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
