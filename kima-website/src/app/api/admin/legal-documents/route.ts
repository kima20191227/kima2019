import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { legalDocumentSchema } from '@/schemas/legal.schema'
import type { LegalDocumentInput } from '@/schemas/legal.schema'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

function mapSections(sections: LegalDocumentInput['sections']) {
  return sections?.map((section, index) => ({
    type: section.type,
    title: section.title,
    content: section.content,
    accessLevel: section.accessLevel,
    order: section.order ?? index,
    authorName: section.authorName ?? null,
    reviewedAt: section.reviewedAt ?? null,
  }))
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user?.role)) {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const documents = await prisma.legalDocument.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    include: { sections: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  })

  return NextResponse.json({ documents })
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!isAdmin(session?.user?.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const parsed = legalDocumentSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const document = await prisma.legalDocument.create({
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary ?? null,
        content: parsed.data.content,
        category: parsed.data.category,
        lawType: parsed.data.lawType ?? null,
        effectiveDate: parsed.data.effectiveDate ?? null,
        sourceUrl: parsed.data.sourceUrl ?? null,
        sourceId: parsed.data.sourceId ?? null,
        isLatest: parsed.data.isLatest,
        accessLevel: parsed.data.accessLevel,
        createdById: session.user.id,
        ...(parsed.data.sections?.length
          ? { sections: { create: mapSections(parsed.data.sections) } }
          : {}),
      },
      include: { sections: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '법령 문서를 등록하는 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
