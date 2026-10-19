import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForumRegisterForm } from '@/components/forum2026/ForumRegisterForm'

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('이름 *'), '홍길동')
  await userEvent.type(screen.getByLabelText('휴대폰 *'), '010-1234-5678')
  await userEvent.type(screen.getByLabelText('이메일 *'), 'test@kima.org')
  await userEvent.type(screen.getByLabelText('소속 단체/교회 *'), '평택이주민교회')
  await userEvent.click(screen.getByLabelText('12월 8일(화)'))
  await userEvent.click(screen.getByLabelText('숙박함'))
  await userEvent.click(screen.getByLabelText('식사함'))
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
      expect(screen.getByText('숙박 여부를 선택해주세요')).toBeInTheDocument()
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
      needsLodging: 'Y',
      needsMeals: 'Y',
      privacyAgreed: true,
    })
    expect(screen.getByText('263101-04-561156')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '계좌번호 복사' })).toBeInTheDocument()
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
})
