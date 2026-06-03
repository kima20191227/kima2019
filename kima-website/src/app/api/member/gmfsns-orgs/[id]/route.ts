import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function whereClause(id: string) {
  const numeric = parseInt(id, 10)
  return !isNaN(numeric) ? { gmfsnsId: numeric } : { id }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  if (session.user.role !== 'OFFICER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { type, representative, targets, languages, address, phone, email, website, introLines, contactItems } = body

  try {
    const org = await prisma.organization.update({
      where: whereClause(id),
      data: {
        ...(type !== undefined ? { type: type || null } : {}),
        ...(representative !== undefined ? { representative: representative || null } : {}),
        ...(targets !== undefined ? { targets } : {}),
        ...(languages !== undefined ? { languages } : {}),
        ...(address !== undefined ? { address: address || null } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(email !== undefined ? { email: email || null } : {}),
        ...(website !== undefined ? { website: website || null } : {}),
        ...(introLines !== undefined ? { introLines } : {}),
        ...(contactItems !== undefined ? { contactItems } : {}),
      },
    })
    return NextResponse.json({ ok: true, org })
  } catch {
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params

  try {
    const org = await prisma.organization.findUnique({ where: whereClause(id) })
    return NextResponse.json({ data: org ?? null })
  } catch {
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  }
}
