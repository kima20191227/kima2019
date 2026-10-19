import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForumRegistrationStatusForm } from '@/components/admin/ForumRegistrationStatusForm'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  refresh.mockReset()
})

describe('ForumRegistrationStatusForm', () => {
  it('변경 전에는 저장 버튼이 비활성화되고, 변경하면 활성화된다', async () => {
    render(<ForumRegistrationStatusForm registrationId="r1" currentStatus="PENDING" currentMemo={null} />)
    const button = screen.getByRole('button', { name: '저장' })
    expect(button).toBeDisabled()

    await userEvent.selectOptions(screen.getByLabelText('입금 상태'), 'CONFIRMED')
    expect(button).toBeEnabled()
  })

  it('저장에 성공하면 저장됨 시각을 표시하고 버튼을 다시 비활성화한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })
    render(<ForumRegistrationStatusForm registrationId="r1" currentStatus="PENDING" currentMemo="" />)

    await userEvent.type(screen.getByLabelText('관리 메모'), '11/30 입금')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(screen.getByText(/저장됨 ✓ \d{2}:\d{2}/)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/forum2026/r1', expect.objectContaining({ method: 'PATCH' }))
    expect(refresh).toHaveBeenCalled()
  })

  it('저장에 실패하면 서버 에러 메시지를 표시한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: '권한이 없습니다.' }) })
    render(<ForumRegistrationStatusForm registrationId="r1" currentStatus="PENDING" currentMemo={null} />)

    await userEvent.selectOptions(screen.getByLabelText('입금 상태'), 'CANCELLED')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => {
      expect(screen.getByText('권한이 없습니다.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled()
  })
})
