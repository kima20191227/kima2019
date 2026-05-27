import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resourceSchema } from '@/schemas/resource.schema'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = resourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.', details: parsed.error.format() }, { status: 400 })
    }

    const resource = await prisma.resource.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        driveUrl: parsed.data.driveUrl,
        fileType: parsed.data.fileType ?? null,
        section: parsed.data.section,
        accessLevel: parsed.data.accessLevel,
        categoryId: parsed.data.categoryId ?? null,
        uploadedById: session.user.id,
      },
    })
    return NextResponse.json({ resource }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '자료 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
