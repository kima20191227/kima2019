import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasAdminMenu } from '@/lib/adminAccess'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const popupSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100),
  body: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  imageWidth: z.string().max(20).optional().nullable(),
  youtubeId: z.string().max(20).optional().nullable(),
  linkUrl: z.string().url().optional().nullable().or(z.literal('')),
  linkLabel: z.string().max(50).optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isActive: z.boolean().default(true),
})

export async function GET() {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'popups'))) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }
    const popups = await prisma.popup.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ popups })
  } catch {
    return NextResponse.json({ error: '팝업 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'popups'))) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }
    const body = await req.json()
    const parsed = popupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }
    const { startAt, endAt, imageUrl, linkUrl, ...rest } = parsed.data
    const popup = await prisma.popup.create({
      data: {
        ...rest,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      },
    })
    return NextResponse.json({ popup }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '팝업 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
