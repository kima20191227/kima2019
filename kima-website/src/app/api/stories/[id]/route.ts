import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

function isAdmin(role?: string) {
  return role === 'ADMIN' || role === 'OFFICER'
}

const adminPatchSchema = z.object({
  type: z.enum(['NOTICE', 'NEWS', 'FIELD_STORY', 'EVENT_MEDIA', 'EVENT_PROMO', 'PRAYER_REQUEST']).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  isPublished: z.boolean().optional(),
  isAnswered: z.boolean().optional(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(300).nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  attachments: z.array(z.object({ url: z.string(), name: z.string(), type: z.string(), isCover: z.boolean().optional() })).nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  source: z.string().max(100).nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  authorName: z.string().max(50).nullable().optional(),
  eventLocation: z.string().max(100).nullable().optional(),
  ministryLocation: z.string().max(100).nullable().optional(),
  videoUrls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

// 작성자 본인이 수정할 수 있는 필드만 허용
const authorPatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(300).nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  attachments: z.array(z.object({ url: z.string(), name: z.string(), type: z.string(), isCover: z.boolean().optional() })).nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  authorName: z.string().max(50).nullable().optional(),
  eventLocation: z.string().max(100).nullable().optional(),
  ministryLocation: z.string().max(100).nullable().optional(),
  videoUrls: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.story.findUnique({ where: { id }, select: { authorId: true } })
    if (!existing) {
      return NextResponse.json({ error: '스토리를 찾을 수 없습니다.' }, { status: 404 })
    }

    const isOwner = existing.authorId === session.user.id
    const isAdminUser = isAdmin(session.user.role)
    if (!isOwner && !isAdminUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const schema = isAdminUser ? adminPatchSchema : authorPatchSchema
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }
    const d = parsed.data as z.infer<typeof adminPatchSchema>
    const story = await prisma.story.update({
      where: { id },
      data: {
        ...(d.type !== undefined ? { type: d.type } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.isPublished !== undefined ? { isPublished: d.isPublished } : {}),
        ...(d.isAnswered !== undefined ? { isAnswered: d.isAnswered } : {}),
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.content !== undefined ? { content: d.content } : {}),
        ...(d.excerpt !== undefined ? { excerpt: d.excerpt } : {}),
        ...(d.thumbnail !== undefined ? { thumbnail: d.thumbnail } : {}),
        ...(d.images !== undefined ? { images: d.images } : {}),
        ...(d.attachments !== undefined ? { attachments: d.attachments ?? undefined } : {}),
        ...(d.linkUrl !== undefined ? { linkUrl: d.linkUrl } : {}),
        ...(d.source !== undefined ? { source: d.source } : {}),
        ...(d.publishedAt !== undefined ? { publishedAt: d.publishedAt ? new Date(d.publishedAt) : null } : {}),
        ...(d.authorName !== undefined ? { authorName: d.authorName } : {}),
        ...(d.eventLocation !== undefined ? { eventLocation: d.eventLocation } : {}),
        ...(d.ministryLocation !== undefined ? { ministryLocation: d.ministryLocation } : {}),
        ...(d.videoUrls !== undefined ? { videoUrls: d.videoUrls } : {}),
        ...(d.tags !== undefined ? { tags: d.tags } : {}),
      },
    })
    return NextResponse.json({ story })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: '수정 중 오류가 발생했습니다.', detail: msg }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const story = await prisma.story.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    })
    if (!story || !story.isPublished) {
      return NextResponse.json({ error: '스토리를 찾을 수 없습니다.' }, { status: 404 })
    }
    return NextResponse.json({ story })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.', detail: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.story.findUnique({ where: { id }, select: { authorId: true } })
    if (!existing) {
      return NextResponse.json({ error: '스토리를 찾을 수 없습니다.' }, { status: 404 })
    }

    const isOwner = existing.authorId === session.user.id
    const isAdminUser = isAdmin(session.user.role)
    if (!isOwner && !isAdminUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    await prisma.story.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.', detail: msg }, { status: 500 })
  }
}
