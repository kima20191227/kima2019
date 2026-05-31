import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/schemas/member.schema'
import { z } from 'zod'

const partialProfileSchema = z.object({
  organization: z.string().max(100).nullable().optional(),
  region: z.string().max(50).nullable().optional(),
})

const fullProfileKeys = [
  'name',
  'position',
  'phone',
  'denomination',
  'address',
  'ministryLanguages',
  'ministryTargets',
]

function nullableText(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed || null
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const isFullProfileUpdate = fullProfileKeys.some((key) => Boolean(body && key in body))

  if (!isFullProfileUpdate) {
    const parsed = partialProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다' }, { status: 400 })
    }

    const { organization, region } = parsed.data
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(organization !== undefined && { organization }),
          ...(region !== undefined && { region }),
        },
      })
      return NextResponse.json({ success: true })
    } catch {
      return NextResponse.json({ error: '저장에 실패했습니다' }, { status: 500 })
    }
  }

  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력값이 올바르지 않습니다', errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const {
    name,
    position,
    phone,
    denomination,
    organization,
    address,
    region,
    ministryLanguages,
    ministryTargets,
  } = parsed.data

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        position: nullableText(position),
        phone: phone.trim(),
        denomination: nullableText(denomination),
        organization: nullableText(organization),
        address: nullableText(address),
        region: nullableText(region),
        ministryLanguages,
        ministryTargets,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        phone: true,
        denomination: true,
        organization: true,
        address: true,
        region: true,
        ministryLanguages: true,
        ministryTargets: true,
      },
    })
    return NextResponse.json({ success: true, user })
  } catch {
    return NextResponse.json({ error: '저장에 실패했습니다' }, { status: 500 })
  }
}
