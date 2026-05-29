import { describe, expect, it } from 'vitest'
import {
  DEFAULT_NEWS_CATEGORIES,
  inferNewsCategory,
  parseNewsCategory,
} from '@/lib/newsCategoryConfig'
import type { RawArticle } from '@/lib/newsCollector'

function article(input: Partial<RawArticle>): RawArticle {
  return {
    title: '',
    summary: '',
    url: 'https://example.com/news',
    sourceName: '네이버 뉴스',
    publishedAt: new Date('2026-05-29T00:00:00.000Z'),
    keywords: [],
    ...input,
  }
}

describe('news category classification', () => {
  it('classifies multicultural family articles by keyword during fallback', () => {
    const result = inferNewsCategory(
      article({
        title: '가평군, 다문화가족 자녀 교육활동비 지원',
        summary: '결혼이민자와 다문화 자녀의 학습 환경을 지원한다.',
        sourceName: '네이버 뉴스 — 다문화가족',
        keywords: ['다문화가족', '결혼이민자'],
        defaultCategory: 'MULTICULTURAL',
      }),
      DEFAULT_NEWS_CATEGORIES,
      'OTHER',
    )

    expect(result).toBe('MULTICULTURAL')
  })

  it('classifies migrant worker articles more specifically than generic migrant news', () => {
    const result = inferNewsCategory(
      article({
        title: '광주시 외국인근로자 축구대회 개최',
        summary: '지역 이주민과 외국인 근로자가 함께했다.',
        sourceName: '네이버 뉴스 — 이주민',
        keywords: ['이주민', '다문화', '외국인 근로자'],
        defaultCategory: 'OTHER',
      }),
      DEFAULT_NEWS_CATEGORIES,
      'OTHER',
    )

    expect(result).toBe('MIGRANT_WORKER')
  })

  it('parses custom category labels and keys', () => {
    const categories = [
      ...DEFAULT_NEWS_CATEGORIES,
      {
        key: 'REFUGEE',
        label: '난민·미등록',
        colorClass: 'bg-cyan-100 text-cyan-700',
        keywords: ['난민', '미등록'],
        order: 60,
        isEnabled: true,
        isSystem: false,
      },
    ]

    expect(parseNewsCategory('난민·미등록(REFUGEE)', categories)).toBe('REFUGEE')
  })
})
