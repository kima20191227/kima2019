import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from '@/components/auth/RegisterForm'

// next/navigation mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

// fetch mock
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

async function fillValidForm() {
  await userEvent.type(screen.getByPlaceholderText('홍길동'), '홍길동')
  await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'test@kima.org')
  await userEvent.type(screen.getByPlaceholderText('영문+숫자 8자 이상'), 'password123')
  await userEvent.type(screen.getByPlaceholderText('비밀번호 재입력'), 'password123')
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '목사' } })
  await userEvent.type(screen.getByPlaceholderText('010-0000-0000'), '010-1234-5678')
  await userEvent.type(
    screen.getByPlaceholderText('예) 예장합동, 예장통합, 기감, 기침 등'),
    '예장합동'
  )
  await userEvent.type(screen.getByPlaceholderText('예) 서울시 강남구 역삼동'), '서울시 강남구')
  await userEvent.type(screen.getByPlaceholderText('예) 베트남어, 네팔어, 중국어'), '베트남어')
  await userEvent.type(screen.getByPlaceholderText('예) 이주노동자, 유학생, 결혼이민자'), '이주노동자')
}

describe('RegisterForm', () => {
  it('빈 폼 제출 시 에러 메시지를 표시한다', async () => {
    render(<RegisterForm />)
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('이름은 2자 이상 입력해주세요')).toBeInTheDocument()
      expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()
      expect(screen.getByText('비밀번호는 8자 이상 입력해주세요')).toBeInTheDocument()
    })
  })

  it('이메일 형식 오류 메시지를 표시한다', async () => {
    render(<RegisterForm />)
    await userEvent.type(screen.getByPlaceholderText('홍길동'), '홍길동')
    await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'invalid-email')
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('올바른 이메일 형식을 입력해주세요')).toBeInTheDocument()
    })
  })

  it('비밀번호 불일치 시 에러 메시지를 표시한다', async () => {
    render(<RegisterForm />)
    await userEvent.type(screen.getByPlaceholderText('홍길동'), '홍길동')
    await userEvent.type(screen.getByPlaceholderText('example@email.com'), 'test@kima.org')
    await userEvent.type(screen.getByPlaceholderText('영문+숫자 8자 이상'), 'password123')
    await userEvent.type(screen.getByPlaceholderText('비밀번호 재입력'), 'different123')
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeInTheDocument()
    })
  })

  it('유효한 입력 후 제출 시 API를 호출한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<RegisterForm />)
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }))
    })
  })

  it('제출 중 버튼이 비활성화된다', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // 응답 없이 대기

    render(<RegisterForm />)
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: '회원가입' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '가입 처리 중...' })).toBeDisabled()
    })
  })
})
