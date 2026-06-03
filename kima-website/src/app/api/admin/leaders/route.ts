import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const leaderSchema = z.object({
  group:    z.enum(['ADVISOR', 'EXECUTIVE', 'LANGUAGE_CHAIR', 'REGION_CHAIR', 'DENOMINATION_REP', 'NETWORK_CHAIR']),
  title:    z.string().min(1).max(50),
  name:     z.string().min(1).max(30),
  org:      z.string().max(100).nullable().optional(),
  position: z.string().max(50).nullable().optional(),
  phone:    z.string().max(30).nullable().optional(),
  email:    z.string().max(100).nullable().optional(),
  nations:  z.string().max(200).nullable().optional(),
  mission:  z.string().max(200).nullable().optional(),
  order:    z.number().int().default(0),
  isActive: z.boolean().default(true),
})

function requireOfficer(role?: string | null) {
  return role === 'ADMIN' || role === 'OFFICER'
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const isLoggedIn = !!session?.user

    const leaders = await prisma.leader.findMany({
      orderBy: [{ group: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    })

    // 비로그인 시 연락처(전화번호·이메일) 제외
    const filtered = leaders.map((l) => ({
      ...l,
      phone: isLoggedIn ? l.phone : null,
      email: isLoggedIn ? l.email : null,
    }))

    return NextResponse.json({ leaders: filtered })
  } catch {
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!requireOfficer(session?.user?.role)) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
    const body = await req.json()
    const parsed = leaderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }
    const { org, position, phone, email, nations, mission, ...rest } = parsed.data
    const leader = await prisma.leader.create({
      data: {
        ...rest,
        org:      org      ?? null,
        position: position ?? null,
        phone:    phone    ?? null,
        email:    email    ?? null,
        nations:  nations  ?? null,
        mission:  mission  ?? null,
      },
    })
    return NextResponse.json({ leader }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
