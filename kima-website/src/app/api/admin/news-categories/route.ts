import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'
import { DEFAULT_NEWS_CATEGORIES, normalizeNewsCategoryKey } from '@/lib/newsCategoryConfig'
import { ensureDefaultNewsCategories, getAllNewsCategories } from '@/lib/newsCategories'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

const categorySchema = z.object({
  key: z.string().min(1).max(40).optional(),
  label: z.string().min(1).max(40),
  colorClass: z.string().min(1).max(120).default('bg-gray-100 text-gray-600'),
  keywords: z.array(z.string().trim().min(1).max(40)).default([]),
  order: z.number().int().min(0).max(9999).default(100),
  isEnabled: z.boolean().default(true),
})

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  await ensureDefaultNewsCategories()
  const categories = await getAllNewsCategories()
  return NextResponse.json({ categories })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  await ensureDefaultNewsCategories()

  const parsed = categorySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
  }

  const key = normalizeNewsCategoryKey(parsed.data.key || parsed.data.label)
  if (!key || key === 'ALL') {
    return NextResponse.json({ error: '사용할 수 없는 카테고리 코드입니다.' }, { status: 400 })
  }

  if (DEFAULT_NEWS_CATEGORIES.some((category) => category.key === key)) {
    return NextResponse.json({ error: '기본 카테고리 코드는 다시 만들 수 없습니다.' }, { status: 409 })
  }

  const category = await prisma.newsCategoryConfig.create({
    data: {
      ...parsed.data,
      key,
      isSystem: false,
    },
  })

  return NextResponse.json({ category }, { status: 201 })
}
