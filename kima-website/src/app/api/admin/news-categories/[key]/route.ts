import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import { ensureDefaultNewsCategories } from '@/lib/newsCategories'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

const patchSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  colorClass: z.string().min(1).max(120).optional(),
  keywords: z.array(z.string().trim().min(1).max(40)).optional(),
  order: z.number().int().min(0).max(9999).optional(),
  isEnabled: z.boolean().optional(),
})

type Ctx = { params: Promise<{ key: string }> }

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  await ensureDefaultNewsCategories()
  const { key } = await params
  const parsed = patchSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const category = await prisma.newsCategoryConfig.update({
    where: { key },
    data: parsed.data,
  })

  return NextResponse.json({ category })
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  await ensureDefaultNewsCategories()
  const { key } = await params
  const category = await prisma.newsCategoryConfig.findUnique({ where: { key } })
  if (!category) return NextResponse.json({ error: '카테고리를 찾을 수 없습니다.' }, { status: 404 })
  if (category.isSystem) {
    return NextResponse.json({ error: '기본 카테고리는 삭제할 수 없습니다.' }, { status: 400 })
  }

  const [newsCount, sourceCount] = await Promise.all([
    prisma.news.count({ where: { category: key } }),
    prisma.newsSource.count({ where: { defaultCategory: key } }),
  ])

  if (newsCount > 0 || sourceCount > 0) {
    return NextResponse.json({ error: '사용 중인 카테고리는 삭제할 수 없습니다.' }, { status: 409 })
  }

  await prisma.newsCategoryConfig.delete({ where: { key } })
  return NextResponse.json({ ok: true })
}
