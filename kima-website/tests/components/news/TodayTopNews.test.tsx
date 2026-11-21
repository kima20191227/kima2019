import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodayTopNews } from '@/components/news/TodayTopNews'
import { findMajorOutlet, type TopNewsItem } from '@/lib/majorNewsOutlets'

const NOW = new Date('2026-11-21T03:00:00.000Z')

function item(id: string, url: string, title: string, summary: string | null): TopNewsItem {
  const outlet = findMajorOutlet(url)
  if (!outlet) throw new Error(`unknown outlet: ${url}`)
  return { id, title, summary, sourceUrl: url, publishedAt: new Date('2026-11-21T01:00:00.000Z'), outlet }
}

const ITEMS = [
  item('a', 'https://www.kmib.co.kr/article/20261119502330', '다문화 소녀를 봉사자로 이끈 멘토', '8년간 100번 넘게 만난 멘토링 이야기'),
  item('b', 'https://www.chosun.com/national/1/', '외국인 근로자 지원 확대', null),
]

describe('TodayTopNews', () => {
  it('24시간 기준이면 "오늘의 주요 뉴스" 제목과 언론사명을 보여준다', () => {
    render(<TodayTopNews items={ITEMS} windowHours={24} now={NOW} />)
    expect(screen.getByRole('heading', { name: '오늘의 주요 뉴스' })).toBeInTheDocument()
    expect(screen.getByText('국민일보')).toBeInTheDocument()
    expect(screen.getByText('조선일보')).toBeInTheDocument()
  })

  it('기간을 넓혔으면 "최근 주요 뉴스"로 표기한다', () => {
    render(<TodayTopNews items={ITEMS} windowHours={72} now={NOW} />)
    expect(screen.getByRole('heading', { name: '최근 주요 뉴스' })).toBeInTheDocument()
  })

  it('요약이 있는 기사는 제목을 누르면 요약과 새 창 원문 링크가 펼쳐진다', async () => {
    render(<TodayTopNews items={ITEMS} windowHours={24} now={NOW} />)
    const details = screen.getByText('다문화 소녀를 봉사자로 이끈 멘토').closest('details')
    expect(details).not.toBeNull()
    expect(details).not.toHaveAttribute('open')

    await userEvent.click(screen.getByText('다문화 소녀를 봉사자로 이끈 멘토'))
    expect(details).toHaveAttribute('open')
    expect(screen.getByText('8년간 100번 넘게 만난 멘토링 이야기')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /국민일보에서 원문 보기/ })
    expect(link).toHaveAttribute('href', 'https://www.kmib.co.kr/article/20261119502330')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('요약이 없는 기사는 제목이 곧 새 창 원문 링크다', () => {
    render(<TodayTopNews items={ITEMS} windowHours={24} now={NOW} />)
    const link = screen.getByRole('link', { name: /외국인 근로자 지원 확대/ })
    expect(link).toHaveAttribute('href', 'https://www.chosun.com/national/1/')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('기사가 없으면 아무것도 그리지 않는다', () => {
    const { container } = render(<TodayTopNews items={[]} windowHours={24} now={NOW} />)
    expect(container).toBeEmptyDOMElement()
  })
})
