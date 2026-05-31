import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseLegalCategory } from '@/lib/legalCategories'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = parseLegalCategory(searchParams.get('category'))
    const query = searchParams.get('q')?.trim()
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10) || 10))

    const where = {
      accessLevel: 'PUBLIC' as const,
      ...(category ? { category } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' as const } },
              { summary: { contains: query, mode: 'insensitive' as const } },
              { content: { contains: query, mode: 'insensitive' as const } },
              { lawType: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [total, documents] = await Promise.all([
      prisma.legalDocument.count({ where }),
      prisma.legalDocument.findMany({
        where,
        orderBy: [
          { isLatest: 'desc' },
          { effectiveDate: 'desc' },
          { updatedAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json(
      { error: '법령 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
