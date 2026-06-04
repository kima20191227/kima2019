/**
 * POST /api/admin/bulk-reset
 * 일회성 실행 엔드포인트 — 실행 후 이 파일을 삭제하세요.
 *
 * 작업:
 * 1. PREMIUM → MEMBER 다운그레이드 (approvedAt·expiresAt 초기화)
 * 2. ADMIN 제외 전체 계정의 비밀번호를 임시값으로 설정
 */
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const TEMP_PASSWORD = 'kima123456'

export async function POST() {
  // ADMIN 권한 확인
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  // ── 1. PREMIUM → MEMBER 다운그레이드 ─────────────────────────────────────
  const downgraded = await prisma.user.updateMany({
    where: { role: 'PREMIUM' },
    data: {
      role:        'MEMBER',
      approvedAt:  null,
      expiresAt:   null,
      premiumNote: null,
    },
  })

  // ── 2. 임시 비밀번호 해시 생성 ────────────────────────────────────────────
  const hash = await bcrypt.hash(TEMP_PASSWORD, 12)

  // ── 3. ADMIN 제외 전체 비밀번호 초기화 ────────────────────────────────────
  const passwordReset = await prisma.user.updateMany({
    where: { role: { not: 'ADMIN' } },
    data:  { password: hash },
  })

  // ── 4. credentials Account.access_token 동기화 ───────────────────────────
  //    (레거시 인증 흐름 대응)
  const affectedUserIds = await prisma.user.findMany({
    where:  { role: { not: 'ADMIN' } },
    select: { id: true },
  })
  const ids = affectedUserIds.map((u) => u.id)

  const tokenSync = await prisma.account.updateMany({
    where: {
      userId:   { in: ids },
      provider: 'credentials',
    },
    data: { access_token: hash },
  })

  return NextResponse.json({
    ok:            true,
    downgraded:    downgraded.count,
    passwordReset: passwordReset.count,
    tokenSync:     tokenSync.count,
    note:          '완료 후 이 파일(/api/admin/bulk-reset/route.ts)을 삭제하세요.',
  })
}
