import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { answerSchema } from '@/schemas/answer.schema'
import type { UserRole } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const answer = await prisma.answer.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!answer) {
      return NextResponse.json({ error: '답변을 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (role !== 'ADMIN' && answer.authorId !== session.user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = answerSchema.pick({ content: true }).safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const updated = await prisma.answer.update({
      where: { id },
      data: { content: parsed.data.content },
    })

    return NextResponse.json({ answer: updated })
  } catch {
    return NextResponse.json({ error: '답변 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const answer = await prisma.answer.findUnique({
      where: { id },
      select: { authorId: true, questionId: true },
    })
    if (!answer) {
      return NextResponse.json({ error: '답변을 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (role !== 'ADMIN' && answer.authorId !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.answer.delete({ where: { id } })

    // If no answers remain, revert question status to PENDING
    const remaining = await prisma.answer.count({
      where: { questionId: answer.questionId, isPublished: true },
    })
    if (remaining === 0) {
      await prisma.question.update({
        where: { id: answer.questionId },
        data: { status: 'PENDING' },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '답변 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
