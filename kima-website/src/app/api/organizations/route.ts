import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { organizationSchema } from '@/schemas/organization.schema'
import { geocodeAddress } from '@/lib/kakaoGeocoding'
import { addressToKimaRegion } from '@/lib/normalizeKoreanAddress'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regions   = searchParams.get('region')?.split(',').filter(Boolean) ?? []
    const languages = searchParams.get('language')?.split(',').filter(Boolean) ?? []
    const targets   = searchParams.get('target')?.split(',').filter(Boolean) ?? []
    const types     = searchParams.get('type')?.split(',').filter(Boolean) ?? []
    const q         = searchParams.get('q')?.trim() ?? ''

    const orgs = await prisma.organization.findMany({
      where: {
        isPublic: true,
        ...(q ? { OR: [
          { name:   { contains: q, mode: 'insensitive' } },
          { nameEn: { contains: q, mode: 'insensitive' } },
        ]} : {}),
        ...(regions.length > 0 ? { region: { in: regions } } : {}),
        ...(languages.length > 0 ? { languages: { hasSome: languages } } : {}),
        ...(targets.length > 0 ? { targets: { hasSome: targets } } : {}),
        ...(types.length > 0 ? { type: { in: types } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ organizations: orgs })
  } catch {
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = organizationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data
    const coords = data.address ? await geocodeAddress(data.address) : null

    // region이 명시되지 않았거나 '기타'이면 주소에서 자동 추론
    const region =
      data.region && data.region !== '기타'
        ? data.region
        : addressToKimaRegion(data.address ?? null, data.region || '기타')

    const org = await prisma.organization.create({
      data: {
        name: data.name,
        representative: data.representative || null,
        nameEn: data.nameEn || null,
        description: data.description || null,
        region,
        languages: data.languages as string[],
        targets: data.targets as string[],
        type: data.type || null,
        address: data.address || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        isPublic: false,
      },
    })

    return NextResponse.json({ organization: org }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '단체 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
