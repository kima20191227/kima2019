/**
 * GET /api/news
 * 이주민·다문화 뉴스 목록 조회 (공개 API)
 *
 * 쿼리 파라미터:
 *   category  NewsCategory (LAW | STATISTICS | MULTICULTURAL | MIGRANT_WORKER | STUDENT | OTHER)
 *   page      정수, default 1
 *   limit     정수, default 20, max 50
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NewsCategory } from '@prisma/client'

const VALID_CATEGORIES = new Set<NewsCategory>([
  'LAW', 'STATISTICS', 'MULTICULTURAL', 'MIGRANT_WORKER', 'STUDENT', 'OTHER',
])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // ── 쿼리 파라미터 파싱 ────────────────────────────────────────────────────
  const rawCategory = (searchParams.get('category') ?? '').toUpperCase() as NewsCategory
  const category    = VALID_CATEGORIES.has(rawCategory) ? rawCategory : undefined

  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))
  const skip  = (page - 1) * limit

  try {
    const where = {
      isVisible: true,
      ...(category ? { category } : {}),
    }

    // 전체 건수 + 목록 병렬 조회
    const [total, items] = await Promise.all([
      prisma.news.count({ where }),
      prisma.news.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take:    limit,
        select: {
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

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/news] 조회 오류:', msg)
    return NextResponse.json(
      { error: '뉴스를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
