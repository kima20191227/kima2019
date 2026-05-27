import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { columnPostSchema } from '@/schemas/column-post.schema'
import { sanitizeRichHtml } from '@/lib/sanitizeHtml'
import type { UserRole } from '@prisma/client'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

export async function GET() {
  try {
    const columns = await prisma.columnPost.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        excerpt: true,
        thumbnail: true,
        tags: true,
        viewCount: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ columns })
  } catch {
    return NextResponse.json({ error: '칼럼 목록을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const role = session.user.role as UserRole
    if ((ROLE_WEIGHT[role] ?? 0) < 1) {
      return NextResponse.json({ error: '일반회원 이상만 칼럼을 작성할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = columnPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const column = await prisma.columnPost.create({
      data: {
        title: parsed.data.title,
        content: sanitizeRichHtml(parsed.data.content),
        excerpt: parsed.data.excerpt ?? null,
        thumbnail: parsed.data.thumbnail ?? null,
        imageUrls: parsed.data.imageUrls ?? [],
        fileUrls: parsed.data.fileUrls ?? [],
        tags: parsed.data.tags ?? [],
        authorId: session.user.id,
      },
    })

    return NextResponse.json({ column }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '칼럼 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
