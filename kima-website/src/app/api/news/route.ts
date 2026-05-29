/**
 * GET /api/news
 * 이주민·다문화 뉴스 목록 조회
 *
 * 쿼리 파라미터:
 *   category  'all' | 'LAW' | 'STATISTICS' | 'MULTICULTURAL' | 'MIGRANT_WORKER' | 'STUDENT' | 'OTHER'
 *   page      정수, default 1
 *   limit     정수, default 12, max 50
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NewsCategory } from '@prisma/client'

const VALID_CATEGORIES = new Set<NewsCategory>([
  'LAW', 'STATISTICS', 'MULTICULTURAL', 'MIGRANT_WORKER', 'STUDENT', 'OTHER',
])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const rawCategory = (searchParams.get('category') ?? 'all').toUpperCase()
  const category    = rawCategory !== 'ALL' && VALID_CATEGORIES.has(rawCategory as NewsCategory)
    ? (rawCategory as NewsCategory)
    : undefined

  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12', 10) || 12))

  try {
    const where = {
      isVisible: true,
      ...(category ? { category } : {}),
    }

    const [total, data] = await Promise.all([
      prisma.news.count({ where }),
      prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
        select:  {
          id:             true,
          title:          true,
          summary:        true,
          sourceUrl:      true,
          sourceName:     true,
          category:       true,
          publishedAt:    true,
          relevanceScore: true,
          keywords:       true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[api/news]', err)
    return NextResponse.json(
      { success: false, error: '뉴스를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
