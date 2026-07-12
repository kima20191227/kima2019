import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { findIdSchema } from '@/schemas/auth.schema'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// 전화번호에서 숫자만 추출 (하이픈/공백 등 제거 후 비교)
function normalizePhone(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

// 이메일 마스킹: @ 앞 앞 2자만 노출, 나머지는 *
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.length > 2 ? 2 : 1
  const masked = local.slice(0, visible) + '*'.repeat(Math.max(local.length - visible, 1))
  return `${masked}@${domain}`
}

export async function POST(req: NextRequest) {
  // IP당 10분에 5회 조회 제한
  const ip = getClientIp(req)
  const { allowed, resetAt } = checkRateLimit(`findid:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  })
  if (!allowed) {
    return NextResponse.json(
      { message: '너무 많은 요청입니다. 잠시 후 다시 시도해 주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await req.json()
    const parsed = findIdSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: '입력값이 올바르지 않습니다', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const { name, phone } = parsed.data
    const normalizedPhone = normalizePhone(phone)

    // 이름으로 후보 조회 — 이름만으로도 조회 가능
    // (DB에 저장된 전화번호 형식과 입력 형식이 다를 수 있어 정규화(숫자만) 비교)
    const candidates = await prisma.user.findMany({ where: { name } })

    if (candidates.length === 0) {
      return NextResponse.json(
        { message: '일치하는 회원 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 전화번호를 입력한 경우, 그 번호와 일치하는 후보가 있으면 그것으로 좁힘
    let matches = candidates
    if (normalizedPhone.length > 0) {
      const byPhone = candidates.filter(
        (u) => normalizePhone(u.phone) === normalizedPhone
      )
      if (byPhone.length > 0) matches = byPhone
    }

    // 동명이인이 남아 하나로 좁혀지지 않으면 전화번호로 구분 요청
    if (matches.length > 1) {
      return NextResponse.json(
        { message: '같은 이름의 회원이 여러 명입니다. 전화번호를 함께 입력해 주세요.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ email: maskEmail(matches[0].email) }, { status: 200 })
  } catch {
    return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
