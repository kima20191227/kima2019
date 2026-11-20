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

const archiveSchema = z.object({
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

export async function GET() {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'forumArchives'))) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const archives = await prisma.forumArchive.findMany({
      include: {
        schedules: { orderBy: { order: 'asc' } },
        materials: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ archives })
  } catch (err) {
    console.error('[forum-archives GET]', err)
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'forumArchives'))) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = archiveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    const { schedules, materials, ...rest } = parsed.data

    const archive = await prisma.forumArchive.create({
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

    return NextResponse.json({ archive }, { status: 201 })
  } catch (err) {
    console.error('[forum-archives POST]', err)
    return NextResponse.json({ error: '등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
