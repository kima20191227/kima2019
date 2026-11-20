import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasAdminMenu } from '@/lib/adminAccess'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const scheduleSchema = z.object({
  time: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  speaker: z.string().max(100).optional().nullable(),
  order: z.number().int().optional().default(0),
})

const materialSchema = z.object({
  title: z.string().min(1).max(200),
  fileType: z.string().min(1).max(20),
  url: z.string().min(1).max(2000),
  order: z.number().int().optional().default(0),
})

const updateSchema = z.object({
  seq: z.string().min(1).max(50),
  type: z.enum(['FORUM', 'LISTENING_CALL']),
  title: z.string().min(1).max(200),
  date: z.string().min(1).max(100),
  location: z.string().max(200).optional().nullable(),
  theme: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  videoUrls: z.array(z.string().max(500)).optional().default([]),
  photos: z.array(z.string().max(2000)).optional().default([]),
  isPublished: z.boolean().optional().default(false),
  schedules: z.array(scheduleSchema).optional().default([]),
  materials: z.array(materialSchema).optional().default([]),
})

type RouteCtx = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteCtx) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'forumArchives'))) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const archive = await prisma.forumArchive.findUnique({
      where: { id },
      include: {
        schedules: { orderBy: { order: 'asc' } },
        materials: { orderBy: { order: 'asc' } },
      },
    })

    if (!archive) {
      return NextResponse.json({ error: '아카이브를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ archive })
  } catch (err) {
    console.error('[forum-archives/[id] GET]', err)
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteCtx) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'forumArchives'))) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    const { schedules, materials, ...rest } = parsed.data

    // Replace schedules and materials atomically
    await prisma.$transaction([
      prisma.forumSchedule.deleteMany({ where: { archiveId: id } }),
      prisma.forumMaterial.deleteMany({ where: { archiveId: id } }),
    ])

    const archive = await prisma.forumArchive.update({
      where: { id },
      data: {
        ...rest,
        schedules: {
          create: schedules.map((s, i) => ({ ...s, order: s.order ?? i })),
        },
        materials: {
          create: materials.map((m, i) => ({ ...m, order: m.order ?? i })),
        },
      },
      include: {
        schedules: { orderBy: { order: 'asc' } },
        materials: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json({ archive })
  } catch (err) {
    console.error('[forum-archives/[id] PUT]', err)
    return NextResponse.json({ error: '수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteCtx) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'forumArchives'))) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    await prisma.forumArchive.delete({ where: { id } })

    return NextResponse.json({ message: '삭제되었습니다.' })
  } catch (err) {
    console.error('[forum-archives/[id] DELETE]', err)
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
