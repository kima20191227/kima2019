import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

const attachmentSchema = z.object({ url: z.string().url(), name: z.string(), type: z.string() })

const updatePostSchema = z.object({
  title: z.string().min(2, '제목은 2자 이상 입력해주세요').max(200, '제목은 200자 이하로 입력해주세요'),
  content: z.string().min(10, '내용은 10자 이상 입력해주세요'),
  type: z.enum(['NOTICE', 'SHARE'], { message: '게시글 유형을 선택해주세요' }),
  attachments: z.array(attachmentSchema).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const roleWeight = ROLE_WEIGHT[session.user.role as UserRole] ?? 0
    const isAuthor = post.authorId === session.user.id
    const isAdmin = roleWeight >= 4
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const { title, content, type, attachments } = parsed.data

    if (type === 'NOTICE' && roleWeight < 3) {
      return NextResponse.json({ error: '공지사항은 임원·위원장 이상만 작성할 수 있습니다.' }, { status: 403 })
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { title, content, type, attachments: attachments ?? [] },
    })

    return NextResponse.json({ post: updated })
  } catch {
    return NextResponse.json({ error: '게시글 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
    }

    const roleWeight = ROLE_WEIGHT[session.user.role as UserRole] ?? 0
    const isAuthor = post.authorId === session.user.id
    const isAdmin = roleWeight >= 4

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
    }

    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
