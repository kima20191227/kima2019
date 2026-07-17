import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { columnPostSchema } from '@/schemas/column-post.schema'
import { sanitizeRichHtml } from '@/lib/sanitizeHtml'
import type { UserRole } from '@prisma/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const column = await prisma.columnPost.findUnique({
      where: { id, isPublished: true },
      include: { author: { select: { id: true, name: true } } },
      // authorName is automatically included
    })
    if (!column) {
      return NextResponse.json({ error: '칼럼을 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ column })
  } catch {
    return NextResponse.json({ error: '칼럼을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
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
    const column = await prisma.columnPost.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!column) {
      return NextResponse.json({ error: '칼럼을 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (role !== 'ADMIN' && column.authorId !== session.user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = columnPostSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const updated = await prisma.columnPost.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.content !== undefined && { content: sanitizeRichHtml(parsed.data.content) }),
        ...(parsed.data.authorName !== undefined && { authorName: parsed.data.authorName }),
        ...(parsed.data.excerpt !== undefined && { excerpt: parsed.data.excerpt }),
        ...(parsed.data.thumbnail !== undefined && { thumbnail: parsed.data.thumbnail }),
        ...(parsed.data.imageUrls !== undefined && { imageUrls: parsed.data.imageUrls }),
        ...(parsed.data.fileUrls !== undefined && { fileUrls: parsed.data.fileUrls }),
        ...(parsed.data.attachments !== undefined && { attachments: parsed.data.attachments ?? undefined }),
        ...(parsed.data.tags !== undefined && { tags: parsed.data.tags }),
      },
    })

    return NextResponse.json({ column: updated })
  } catch {
    return NextResponse.json({ error: '칼럼 수정 중 오류가 발생했습니다.' }, { status: 500 })
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
    const column = await prisma.columnPost.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!column) {
      return NextResponse.json({ error: '칼럼을 찾을 수 없습니다.' }, { status: 404 })
    }

    const role = session.user.role as UserRole
    if (role !== 'ADMIN' && column.authorId !== session.user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.columnPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '칼럼 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
