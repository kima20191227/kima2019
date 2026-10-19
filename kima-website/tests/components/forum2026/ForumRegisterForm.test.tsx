import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForumRegisterForm } from '@/components/forum2026/ForumRegisterForm'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

const group = (name: RegExp) => within(screen.getByRole('group', { name }))

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('이름 *'), '홍길동')
  await userEvent.type(screen.getByLabelText('휴대폰 *'), '010-1234-5678')
  await userEvent.type(screen.getByLabelText('이메일 *'), 'test@kima.org')
  await userEvent.type(screen.getByLabelText('소속 단체/교회 *'), '평택이주민교회')
  await userEvent.click(group(/참석 일정/).getByLabelText('12월 8일(화)'))
  await userEvent.click(group(/^숙박/).getByLabelText('12월 8일(화) 밤'))
  await userEvent.click(group(/^식사/).getByLabelText('12월 8일(화)'))
  await userEvent.type(screen.getByLabelText('입금자명 *'), '홍길동')
  await userEvent.click(screen.getByLabelText('개인정보 수집·이용에 동의합니다 *'))
}

describe('ForumRegisterForm', () => {
  it('빈 폼 제출 시 필수 항목 에러를 표시한다', async () => {
    render(<ForumRegisterForm />)
    fireEvent.click(screen.getByRole('button', { name: '참가 신청하기' }))

    await waitFor(() => {
      expect(screen.getByText('이름은 2자 이상 입력해주세요')).toBeInTheDocument()
      expect(screen.getByText('휴대폰 번호를 입력해주세요')).toBeInTheDocument()
      expect(screen.getByText('참석 일정을 1개 이상 선택해주세요')).toBeInTheDocument()
      expect(screen.getByText('입금자명을 입력해주세요')).toBeInTheDocument()
      expect(screen.getByText('개인정보 수집·이용에 동의해주세요')).toBeInTheDocument()
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('로그인 사용자 정보로 이름·이메일을 미리 채운다', () => {
    render(<ForumRegisterForm defaultName="김선교" defaultEmail="kim@kima.org" />)
    expect(screen.getByLabelText('이름 *')).toHaveValue('김선교')
    expect(screen.getByLabelText('이메일 *')).toHaveValue('kim@kima.org')
  })

  it('유효한 입력 후 제출하면 API를 호출하고 완료 화면을 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<ForumRegisterForm />)
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: '참가 신청하기' }))

    await waitFor(() => {
      expect(screen.getByText('신청 완료')).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/forum2026/register', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toMatchObject({
      attendDays: ['2026-12-08'],
      lodgingDays: ['2026-12-08'],
      mealDays: ['2026-12-08'],
      privacyAgreed: true,
    })
    expect(screen.getByText('435-910079-52904')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '계좌번호 복사' })).toBeInTheDocument()
    expect(screen.getByText(/입금 후 2~3일 내 확인/)).toBeInTheDocument()
    expect(screen.getByText(/2026년 11월 24일\(화\)까지 환불 가능/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'info@kima2019.org' })).toHaveAttribute(
      'href',
      'mailto:info@kima2019.org'
    )
  })

  it('중복 신청 시 서버 메시지를 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: '이미 신청하셨습니다' }) })

    render(<ForumRegisterForm />)
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: '참가 신청하기' }))

    await waitFor(() => {
      expect(screen.getByText('이미 신청하셨습니다')).toBeInTheDocument()
    })
  })

  it('사역 언어권은 기본 9개만 보이고 전체 보기로 나머지를 펼친다', async () => {
    render(<ForumRegisterForm />)
    expect(screen.getByLabelText('베트남어')).toBeInTheDocument()
    expect(screen.getByLabelText('영어')).toBeInTheDocument()
    expect(screen.queryByLabelText('캄보디아어')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /전체 보기 \(\+13\)/ }))
    expect(screen.getByLabelText('캄보디아어')).toBeInTheDocument()

    // 펼친 목록에서 고른 항목이 있으면 접기 버튼을 숨겨 선택이 사라지지 않게 한다
    await userEvent.click(screen.getByLabelText('캄보디아어'))
    expect(screen.queryByRole('button', { name: '접기' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('캄보디아어')).toBeChecked()

    await userEvent.click(screen.getByLabelText('캄보디아어'))
    await userEvent.click(screen.getByRole('button', { name: '접기' }))
    expect(screen.queryByLabelText('캄보디아어')).not.toBeInTheDocument()
  })

  it('제출 버튼 위에 참가비·신청 마감·입금 계좌 요약을 보여준다', () => {
    render(<ForumRegisterForm deadlineText="12월 7일 (월)" />)
    const box = within(screen.getByLabelText('신청 요약'))
    expect(box.getByText('참가비')).toBeInTheDocument()
    expect(box.getByText('5만 원')).toBeInTheDocument()
    expect(box.getByText('신청 마감')).toBeInTheDocument()
    expect(box.getByText('12월 7일 (월)')).toBeInTheDocument()
    expect(box.getByText('입금 계좌')).toBeInTheDocument()
    expect(box.getByText(/하나은행 435-910079-52904/)).toBeInTheDocument()
    expect(box.getByText('참석 일수와 관계없이 동일 (1일만 참석해도 5만 원)')).toBeInTheDocument()
    expect(box.getByText('포럼 시작 2주 전인 2026년 11월 24일(화)까지 환불 가능')).toBeInTheDocument()
    expect(box.getByRole('link', { name: 'info@kima2019.org' })).toHaveAttribute('href', 'mailto:info@kima2019.org')
  })

  it('숙박(8·9일 밤)·식사(3일) 날짜는 참석일을 고른 날만 선택할 수 있다', async () => {
    render(<ForumRegisterForm />)
    const lodging = group(/^숙박/)
    const meals = group(/^식사/)
    expect(lodging.getAllByRole('checkbox')).toHaveLength(2)
    expect(lodging.queryByLabelText(/12월 10일/)).not.toBeInTheDocument()
    expect(meals.getAllByRole('checkbox')).toHaveLength(3)
    expect(screen.getAllByText('참석 일정을 먼저 선택하세요')).toHaveLength(2)
    for (const box of [...lodging.getAllByRole('checkbox'), ...meals.getAllByRole('checkbox')]) {
      expect(box).toBeDisabled()
    }

    await userEvent.click(group(/참석 일정/).getByLabelText('12월 9일(수)'))
    expect(lodging.getByLabelText('12월 9일(수) 밤')).toBeEnabled()
    expect(lodging.getByLabelText('12월 8일(화) 밤')).toBeDisabled()
    expect(meals.getByLabelText('12월 9일(수)')).toBeEnabled()
    expect(meals.getByLabelText('12월 10일(목)')).toBeDisabled()
    expect(screen.getByText('숙박할 날짜를 선택하세요 (해당 없으면 선택하지 않음)')).toBeInTheDocument()
    expect(screen.getByText('식사할 날짜를 선택하세요 (해당 없으면 선택하지 않음)')).toBeInTheDocument()
  })

  it('참석일을 해제하면 그날의 숙박·식사 선택도 지워진다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    render(<ForumRegisterForm />)
    await fillValidForm()
    await userEvent.click(group(/참석 일정/).getByLabelText('12월 9일(수)'))
    await userEvent.click(group(/^숙박/).getByLabelText('12월 9일(수) 밤'))
    await userEvent.click(group(/^식사/).getByLabelText('12월 9일(수)'))

    // 8일 참석 해제 → 8일 밤 숙박·8일 식사 선택 해제
    await userEvent.click(group(/참석 일정/).getByLabelText('12월 8일(화)'))
    expect(group(/^숙박/).getByLabelText('12월 8일(화) 밤')).not.toBeChecked()
    expect(group(/^식사/).getByLabelText('12월 8일(화)')).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: '참가 신청하기' }))
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toMatchObject({
      attendDays: ['2026-12-09'],
      lodgingDays: ['2026-12-09'],
      mealDays: ['2026-12-09'],
    })
  })

  it('숙박·식사를 선택하지 않아도 신청할 수 있다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    render(<ForumRegisterForm />)
    await fillValidForm()
    await userEvent.click(group(/^숙박/).getByLabelText('12월 8일(화) 밤'))
    await userEvent.click(group(/^식사/).getByLabelText('12월 8일(화)'))
    fireEvent.click(screen.getByRole('button', { name: '참가 신청하기' }))
    await waitFor(() => expect(screen.getByText('신청 완료')).toBeInTheDocument())
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toMatchObject({ lodgingDays: [], mealDays: [] })
  })
})
