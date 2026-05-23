import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { postSchema } from '@/schemas/post.schema'
import type { UserRole } from '@prisma/client'

const CAN_WRITE: UserRole[] = ['PREMIUM', 'OFFICER', 'ADMIN']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type') as 'NOTICE' | 'SHARE' | 'INTRODUCE' | null

    const posts = await prisma.post.findMany({
      where: {
        isPublished: true,
        ...(categoryId ? { categoryId } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ error: '게시글을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    if (!CAN_WRITE.includes(session.user.role)) {
      return NextResponse.json({ error: '게시글 작성 권한이 없습니다. (임원·위원장 이상)' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const { title, content, type, categoryId, attachments } = parsed.data

    if ((type === 'NOTICE' || type === 'INTRODUCE') && !['OFFICER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: '이 유형은 임원·위원장 이상만 작성할 수 있습니다.' }, { status: 403 })
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } })
    if (!category) {
      return NextResponse.json({ error: '존재하지 않는 카테고리입니다.' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: { title, content, type, categoryId, authorId: session.user.id, attachments: attachments ?? [] },
      include: { author: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '게시글 작성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
