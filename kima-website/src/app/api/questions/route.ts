import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { questionSchema } from '@/schemas/question.schema'
import type { UserRole } from '@prisma/client'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

export async function GET() {
  try {
    const questions = await prisma.question.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: { select: { name: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ questions })
  } catch {
    return NextResponse.json({ error: '질문 목록을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
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
      return NextResponse.json({ error: '일반회원 이상만 질문을 작성할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = questionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const question = await prisma.question.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        attachments: parsed.data.attachments ?? [],
        authorId: session.user.id,
      },
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '질문 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
