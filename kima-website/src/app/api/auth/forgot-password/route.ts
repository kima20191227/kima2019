import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/schemas/auth.schema'
import { sendEmail, resetPasswordEmailHtml, SITE_URL } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// 계정 존재 여부 유출 방지를 위한 공통 성공 응답
const SUCCESS_MESSAGE =
  '입력하신 이메일로 재설정 링크를 발송했습니다. (가입된 이메일인 경우)'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // IP당 10분에 5회 제한
  const ipLimit = checkRateLimit(`forgotpw:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  })
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { message: '너무 많은 요청입니다. 잠시 후 다시 시도해 주세요.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: '입력값이 올바르지 않습니다', errors: parsed.error.format() },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    // 이메일당 15분에 3회 제한 (남발 방지) — 실패해도 성공 메시지는 유지하기 위해 여기서 차단
    const emailLimit = checkRateLimit(`forgotpw:${email}`, {
      limit: 3,
      windowMs: 15 * 60 * 1000,
    })
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { message: '너무 많은 요청입니다. 잠시 후 다시 시도해 주세요.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((emailLimit.resetAt - Date.now()) / 1000)) },
        }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // credentials 계정(비밀번호 보유)만 실제 재설정 링크 발송
    if (user && user.password) {
      const token = crypto.randomBytes(32).toString('hex')
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      })

      const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`
      // 메일 발송 실패해도 동일한 성공 응답 유지 (계정 존재 여부 은닉)
      sendEmail(
        email,
        '[KIMA] 비밀번호 재설정 안내',
        resetPasswordEmailHtml(user.name ?? '회원', resetUrl)
      ).catch(() => {})
    }

    // 이메일 존재 여부와 무관하게 항상 동일한 성공 응답
    return NextResponse.json({ message: SUCCESS_MESSAGE }, { status: 200 })
  } catch {
    return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
