import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다.' }, { status: 404 })
    }
    const [postCount, resourceCount] = await Promise.all([
      prisma.post.count({ where: { categoryId: id } }),
      prisma.resource.count({ where: { categoryId: id } }),
    ])
    if (postCount > 0 || resourceCount > 0) {
      return NextResponse.json(
        { error: `게시글 ${postCount}개, 자료 ${resourceCount}개가 연결되어 있어 삭제할 수 없습니다.` },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '카테고리 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

const patchSchema = z.object({
  name:         z.string().min(1).max(50).optional(),
  slug:         z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'slug는 소문자, 숫자, 하이픈만 가능합니다').optional(),
  flag:         z.string().max(2000).nullable().optional(),
  officerName:  z.string().max(100).nullable().optional(),
  officerPhone: z.string().max(20).nullable().optional(),
  officerEmail: z.string().max(200).nullable().optional(),
  officerSns:   z.string().max(200).nullable().optional(),
  officerQr:    z.string().max(500).nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    if (parsed.data.slug) {
      const dup = await prisma.category.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } })
      if (dup) return NextResponse.json({ error: '이미 사용 중인 slug입니다.' }, { status: 409 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    })
    return NextResponse.json({ category })
  } catch {
    return NextResponse.json({ error: '카테고리 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
