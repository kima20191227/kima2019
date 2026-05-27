import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { questionSchema } from '@/schemas/question.schema'
import type { UserRole } from '@prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const question = await prisma.question.findUnique({
      where: { id, isPublished: true },
      include: {
        author: { select: { id: true, name: true } },
        answers: {
          where: { isPublished: true },
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!question) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ question })
  } catch {
    return NextResponse.json({ error: '질문을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

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
    const question = await prisma.question.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!question) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (role !== 'ADMIN' && question.authorId !== session.user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = questionSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.content !== undefined && { content: parsed.data.content }),
      },
    })

    return NextResponse.json({ question: updated })
  } catch {
    return NextResponse.json({ error: '질문 수정 중 오류가 발생했습니다.' }, { status: 500 })
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
    const question = await prisma.question.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!question) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (role !== 'ADMIN' && question.authorId !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    // Cascade delete via Prisma schema (Answer.onDelete: Cascade)
    await prisma.question.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '질문 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
