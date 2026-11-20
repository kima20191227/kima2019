import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { hasAdminMenu } from '@/lib/adminAccess'
import { prisma } from '@/lib/prisma'
import { sendEmail, organizationApprovedEmailHtml } from '@/lib/email'
import { geocodeAddress } from '@/lib/kakaoGeocoding'
import { addressToKimaRegion } from '@/lib/normalizeKoreanAddress'
import { z } from 'zod/v4'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'organizations'))) {
      return NextResponse.json({ error: '최고 관리자만 단체를 삭제할 수 있습니다.' }, { status: 403 })
    }
    const { id } = await params
    await prisma.organization.delete({ where: { id } })
    return NextResponse.json({ message: '단체가 삭제되었습니다.' })
  } catch {
    return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

const patchSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectReason: z.string().max(500).optional(),
})

const editSchema = z.object({
  name: z.string().min(1).max(100),
  representative: z.string().max(50).nullable().optional(),
  nameEn: z.string().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  region: z.string(),
  languages: z.array(z.string()).min(1),
  targets: z.array(z.string()).min(1),
  type: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!(await hasAdminMenu(session, 'organizations'))) {
      return NextResponse.json({ error: '최고 관리자만 단체를 승인·반려할 수 있습니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    if (parsed.data.action === 'approve') {
      // 좌표가 없고 주소가 있으면 지오코딩
      const existing = await prisma.organization.findUnique({ where: { id }, select: { address: true, lat: true } })
      let coordsData: { lat?: number; lng?: number } = {}
      if (existing?.address && existing.lat == null) {
        const coords = await geocodeAddress(existing.address)
        if (coords) coordsData = coords
      }

      const org = await prisma.organization.update({
        where: { id },
        data: { isPublic: true, ...coordsData },
      })

      // 단체 이메일이 있으면 승인 알림 발송
      if (org.email) {
        sendEmail(
          org.email,
          '[KIMA] 단체 등록이 완료되었습니다',
          organizationApprovedEmailHtml(org.name)
        ).catch(() => {})
      }

      return NextResponse.json({ org })
    }

    // reject: delete the organization record
    await prisma.organization.delete({ where: { id } })
    return NextResponse.json({ message: '반려 처리되었습니다.' })
  } catch {
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (role !== 'ADMIN' && role !== 'OFFICER') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = editSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    const d = parsed.data

    // region이 '기타'이면 주소에서 자동 추론 시도
    const region =
      d.region && d.region !== '기타'
        ? d.region
        : addressToKimaRegion(d.address ?? null, d.region || '기타')

    const org = await prisma.organization.update({
      where: { id },
      data: {
        name: d.name,
        representative: d.representative ?? null,
        nameEn: d.nameEn ?? null,
        description: d.description ?? null,
        region,
        languages: d.languages,
        targets: d.targets,
        type: d.type ?? null,
        address: d.address ?? null,
        phone: d.phone ?? null,
        email: d.email ?? null,
        website: d.website ?? null,
        ...(d.isPublic !== undefined ? { isPublic: d.isPublic } : {}),
      },
    })

    return NextResponse.json({ org })
  } catch {
    return NextResponse.json({ error: '수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
