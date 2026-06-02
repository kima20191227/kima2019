import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { legalDocumentSchema } from '@/schemas/legal.schema'
import type { LegalDocumentInput } from '@/schemas/legal.schema'

function isAdmin(role?: string | null) {
  return role === 'ADMIN'
}

type Context = { params: Promise<{ id: string }> }

function hasKey(body: unknown, key: string) {
  return typeof body === 'object' && body !== null && Object.prototype.hasOwnProperty.call(body, key)
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

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const session = await auth()
    if (!isAdmin(session?.user?.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = legalDocumentSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: parsed.error.format() },
        { status: 400 },
      )
    }

    const document = await prisma.legalDocument.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(hasKey(body, 'summary') && { summary: parsed.data.summary ?? null }),
        ...(parsed.data.content !== undefined && { content: parsed.data.content }),
        ...(parsed.data.category !== undefined && { category: parsed.data.category }),
        ...(hasKey(body, 'lawType') && { lawType: parsed.data.lawType ?? null }),
        ...(hasKey(body, 'effectiveDate') && { effectiveDate: parsed.data.effectiveDate ?? null }),
        ...(hasKey(body, 'sourceUrl') && { sourceUrl: parsed.data.sourceUrl ?? null }),
        ...(hasKey(body, 'sourceId') && { sourceId: parsed.data.sourceId ?? null }),
        ...(hasKey(body, 'isLatest') && { isLatest: parsed.data.isLatest }),
        ...(hasKey(body, 'accessLevel') && { accessLevel: parsed.data.accessLevel }),
        ...(hasKey(body, 'sections') && {
          sections: {
            deleteMany: {},
            create: mapSections(parsed.data.sections) ?? [],
          },
        }),
      },
      include: { sections: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
    })

    return NextResponse.json({ document })
  } catch {
    return NextResponse.json(
      { error: '법령 문서를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const session = await auth()
    if (!isAdmin(session?.user?.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const { id } = await params
    await prisma.legalDocument.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '법령 문서를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
