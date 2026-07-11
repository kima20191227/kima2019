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

    // 이름이 일치하는 회원을 조회한 뒤, 전화번호는 정규화(숫자만) 비교로 필터링
    // (DB에 저장된 형식과 입력 형식이 다를 수 있음 — 소규모 사이트라 전체 스캔 문제 없음)
    const candidates = await prisma.user.findMany({ where: { name } })
    const matched = candidates.find(
      (u) => normalizePhone(u.phone) === normalizedPhone && normalizedPhone.length > 0
    )

    if (!matched) {
      return NextResponse.json(
        { message: '일치하는 회원 정보를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({ email: maskEmail(matched.email) }, { status: 200 })
  } catch {
    return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
