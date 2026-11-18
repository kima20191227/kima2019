import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForumSurveyForm } from '@/components/forum2026/ForumSurveyForm'

afterEach(() => vi.restoreAllMocks())

describe('ForumSurveyForm', () => {
  it('빈 폼을 제출하면 필수 문항 에러를 보여주고 API를 호출하지 않는다', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    render(<ForumSurveyForm />)
    await userEvent.click(screen.getByRole('button', { name: '설문 제출하기' }))
    expect((await screen.findAllByText('필수 문항입니다')).length).toBeGreaterThanOrEqual(4)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('필수 문항을 채우면 이름 없이도 제출된다', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ message: 'ok' }), { status: 201 }))
    render(<ForumSurveyForm />)

    await userEvent.click(screen.getByLabelText('12월 8일(화)'))
    await userEvent.click(screen.getAllByLabelText('5점 매우 좋음')[0]) // 전체 만족도
    const programGroup = screen.getByText('프로그램 구성과 시간 운영').closest('fieldset')!
    await userEvent.click(programGroup.querySelector('input[aria-label="4점 좋음"]')!)
    const revisit = screen.getByText('내년 KIMA 포럼에 다시 참석하시겠습니까?').closest('fieldset')!
    await userEvent.click(revisit.querySelector('input[type="radio"]')!)
    await userEvent.click(screen.getByLabelText('9점'))
    await userEvent.click(screen.getByRole('button', { name: '설문 제출하기' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
    expect(body.answers.overall).toBe(5)
    expect(body.answers.nps).toBe(9)
    expect(await screen.findByText('소중한 의견 감사합니다')).toBeInTheDocument()
  })

  it('미리보기 표시가 보이고 제출하지 않는다', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    render(<ForumSurveyForm previewOnly />)
    expect(screen.getByText(/관리자 미리보기/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
