import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, premiumApprovedEmailHtml } from '@/lib/email'
import { z } from 'zod/v4'
import type { UserRole } from '@prisma/client'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: '자기 자신은 삭제할 수 없습니다.' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: '회원이 삭제되었습니다.' })
  } catch {
    return NextResponse.json({ error: '회원 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

const patchSchema = z.object({
  // 등급·메모 (기존)
  role:         z.enum(['MEMBER', 'PREMIUM', 'OFFICER', 'ADMIN']).optional(),
  premiumNote:  z.string().max(500).nullable().optional(),
  // 프로필 편집 (신규)
  name:         z.string().min(1).max(50).optional(),
  organization: z.string().max(100).nullable().optional(),
  position:     z.string().max(50).nullable().optional(),
  phone:        z.string().max(30).nullable().optional(),
  address:      z.string().max(200).nullable().optional(),
  denomination: z.string().max(100).nullable().optional(),
  region:       z.string().max(50).nullable().optional(),
  expiresAt:    z.string().datetime().nullable().optional(),
})

const noteOnlySchema = z.object({
  premiumNote: z.string().max(500).nullable().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const role = session?.user?.role
    const isAdmin = role === 'ADMIN'
    const isOfficerOrAbove = role === 'ADMIN' || role === 'OFFICER'

    if (!isOfficerOrAbove) {
      return NextResponse.json({ error: '임원 이상 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    // 임원(OFFICER)은 납부 메모만 수정 가능
    if (!isAdmin) {
      const parsed = noteOnlySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
      }
      const user = await prisma.user.update({
        where: { id },
        data: { premiumNote: parsed.data.premiumNote },
      })
      return NextResponse.json({ user })
    }

    // 관리자(ADMIN) — 전체 편집 가능
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 })
    }

    const current = await prisma.user.findUnique({ where: { id }, select: { premiumNote: true } })

    const updateData: Record<string, unknown> = {}

    // 등급 변경
    if (parsed.data.role !== undefined) {
      updateData.role = parsed.data.role as UserRole
      if (parsed.data.role === 'PREMIUM') {
        updateData.approvedAt = new Date()
        const expires = new Date()
        expires.setFullYear(expires.getFullYear() + 1)
        updateData.expiresAt = expires
        if (current?.premiumNote?.startsWith('[신청]')) {
          updateData.premiumNote = current.premiumNote.replace('[신청]', '[승인됨]')
        }
      }
    }
    if ('premiumNote' in parsed.data) updateData.premiumNote = parsed.data.premiumNote

    // 프로필 필드
    const profileFields = ['name', 'organization', 'position', 'phone', 'address', 'denomination', 'region'] as const
    for (const f of profileFields) {
      if (f in parsed.data) updateData[f] = (parsed.data as Record<string, unknown>)[f] ?? null
    }
    if ('expiresAt' in parsed.data) {
      updateData.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null
    }

    const user = await prisma.user.update({ where: { id }, data: updateData })

    // 정회원 승급 시 승인 이메일 발송
    if (parsed.data.role === 'PREMIUM' && user.email) {
      sendEmail(
        user.email,
        '[KIMA] 정회원 승인이 완료되었습니다',
        premiumApprovedEmailHtml(user.name ?? '회원')
      ).catch(() => {})
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: '회원 정보 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
