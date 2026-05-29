import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod/v4'

const createSchema = z.object({
  type: z.enum(['REGION', 'LANGUAGE', 'TARGET']),
  name: z.string().min(1, '이름을 입력해주세요').max(50),
  slug: z
    .string()
    .min(1, 'slug를 입력해주세요')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'slug는 소문자, 숫자, 하이픈(-)만 사용 가능합니다'),
  flag: z.string().max(2000).nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.format()).find(
        (v) => v && typeof v === 'object' && '_errors' in v
      ) as { _errors: string[] } | undefined
      return NextResponse.json(
        { error: firstError?._errors[0] ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const { type, name, slug, flag } = parsed.data

    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 slug입니다.' }, { status: 409 })
    }

    const agg = await prisma.category.aggregate({ where: { type }, _max: { order: true } })

    const category = await prisma.category.create({
      data: { type, name, slug, flag: flag ?? null, order: (agg._max.order ?? 0) + 1 },
    })
    return NextResponse.json({ category }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '카테고리 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
