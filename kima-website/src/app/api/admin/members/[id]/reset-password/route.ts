import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const TEMP_PASSWORD = 'kima123456'

type Context = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true, name: true },
    })

    if (!target) {
      return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 다른 ADMIN 계정의 비밀번호는 초기화 불가
    if (target.role === 'ADMIN' && target.id !== session.user.id) {
      return NextResponse.json(
        { error: '다른 관리자 계정의 비밀번호는 초기화할 수 없습니다.' },
        { status: 403 },
      )
    }

    const hash = await bcrypt.hash(TEMP_PASSWORD, 12)

    // User.password 업데이트
    await prisma.user.update({
      where: { id },
      data: { password: hash },
    })

    // credentials Account.access_token 동기화 (레거시 인증 대응)
    await prisma.account.updateMany({
      where: { userId: id, provider: 'credentials' },
      data: { access_token: hash },
    })

    // 소셜 로그인 전용 여부 확인 (비밀번호 없고 credentials 계정도 없는 경우)
    const credAccount = await prisma.account.findFirst({
      where: { userId: id, provider: 'credentials' },
    })
    const isSocialOnly = !credAccount && !(await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    }))?.password

    return NextResponse.json({
      ok: true,
      socialOnly: isSocialOnly,
      message: isSocialOnly
        ? '임시 비밀번호가 설정되었습니다. 단, 이 계정은 소셜 로그인 전용이므로 이메일 로그인이 불가할 수 있습니다.'
        : '비밀번호가 임시값(kima123456)으로 초기화되었습니다.',
    })
  } catch {
    return NextResponse.json({ error: '비밀번호 초기화 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
