import { describe, expect, it } from 'vitest'
import { isMissionRelevantArticle } from '@/lib/newsMissionRelevance'
import type { RawArticle } from '@/lib/newsCollector'

function article(overrides: Partial<RawArticle>): RawArticle {
  return {
    title: '테스트 기사',
    summary: '',
    url: 'https://example.com/news',
    sourceName: '테스트',
    publishedAt: new Date('2026-05-29T00:00:00.000Z'),
    keywords: [],
    ...overrides,
  }
}

describe('isMissionRelevantArticle', () => {
  it('keeps multicultural family articles even when categorized as other', () => {
    expect(isMissionRelevantArticle(article({
      title: '다문화가족 자녀 교육활동비 지원 확대',
      summary: '결혼이민자 가정과 다문화 자녀의 안정적인 학업을 돕는 지역 지원 사업이다.',
      keywords: ['다문화가족', '결혼이민자'],
      defaultCategory: 'OTHER',
    }))).toBe(true)
  })

  it('excludes sports articles that only mention foreign-player visas', () => {
    expect(isMissionRelevantArticle(article({
      title: "고척돔 불 안 꺼졌다→키움, '불금 특타' 진행",
      summary: '외국인 선수의 취업비자 발급과 KBO 데뷔 일정이 언급된 프로야구 기사다.',
      url: 'https://www.xportsnews.com/article/2154946',
      keywords: ['외국인', '비자'],
      defaultCategory: 'LAW',
    }))).toBe(false)
  })

  it('keeps ministry articles even when the title mentions sports activities', () => {
    expect(isMissionRelevantArticle(article({
      title: '다문화가족 자녀 축구교실 운영',
      summary: '지역 가족센터가 다문화가족 자녀의 관계 형성과 정착을 돕는 프로그램을 운영한다.',
      keywords: ['다문화가족', '가족센터'],
      defaultCategory: 'WELFARE',
    }))).toBe(true)
  })

  it('keeps nationality worker articles as migrant-worker evidence', () => {
    expect(isMissionRelevantArticle(article({
      title: '"숙식비 1300만원 내라" 재판 열린 줄도 몰랐던 태국 노동자',
      summary: '사업장과 숙소 문제로 법적 분쟁을 겪은 이주노동자 사례를 다룬 기사다.',
      keywords: ['이주노동자'],
      defaultCategory: 'MIGRANT_WORKER',
    }))).toBe(true)
  })

  it('keeps immigration administration articles with labor-ministry context', () => {
    expect(isMissionRelevantArticle(article({
      title: '워크숍 다녀오니 입국 금지, 법무-고용부 이중 행정 논란',
      summary: '고용노동부와 법무부 행정 차이로 노동자가 체류와 입국 문제를 겪은 사례다.',
      defaultCategory: 'MIGRANT_WORKER',
    }))).toBe(true)
  })

  it('excludes personal crime articles that are not useful for migrant ministry', () => {
    expect(isMissionRelevantArticle(article({
      title: '"헤어지자" 했다고 여친을 유흥업소녀로 등록한 공무원',
      summary: '출입국 공무원이 전 여자친구를 상대로 허위 정보를 등록한 개인 범죄 사건이다.',
      url: 'http://www.inews24.com/view/1972637',
      keywords: ['법무부', '외국인'],
      defaultCategory: 'LAW',
    }))).toBe(false)
  })

  it('does not treat search source labels or query keywords as article evidence', () => {
    expect(isMissionRelevantArticle(article({
      title: '오늘의 안전 상황',
      summary: '고가도로 공사장 사고와 재난 대응 현황을 정리한 일반 안전 기사다.',
      sourceName: '네이버 뉴스 — 이주민',
      keywords: ['이주민', '지원'],
      defaultCategory: 'MIGRANT_WORKER',
    }))).toBe(false)
  })
})
