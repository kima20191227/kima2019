import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { answerSchema } from '@/schemas/answer.schema'
import type { UserRole } from '@prisma/client'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const role = session.user.role as UserRole
    if ((ROLE_WEIGHT[role] ?? 0) < 1) {
      return NextResponse.json({ error: '일반회원 이상만 답변을 작성할 수 있습니다.' }, { status: 403 })
    }

    const { id: questionId } = await params
    const question = await prisma.question.findUnique({
      where: { id: questionId, isPublished: true },
      select: { id: true },
    })
    if (!question) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 })
    }

    const body = await request.json()
    // questionId comes from URL; validate only content from body
    const parsed = answerSchema.pick({ content: true }).safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    // Create answer and update question status to ANSWERED atomically
    const [answer] = await prisma.$transaction([
      prisma.answer.create({
        data: {
          content: parsed.data.content,
          questionId,
          authorId: session.user.id,
        },
        include: { author: { select: { id: true, name: true } } },
      }),
      prisma.question.update({
        where: { id: questionId },
        data: { status: 'ANSWERED' },
      }),
    ])

    return NextResponse.json({ answer }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '답변 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
