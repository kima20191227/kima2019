import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from '@/lib/email'
import { notifyOutdatedLegal, validateLegalSource } from '@/lib/legalContentValidator'

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}))

describe('legalContentValidator', () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL
  const originalNextAuthUrl = process.env.NEXTAUTH_URL

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env.ADMIN_EMAIL = 'admin@kima2019.org'
    process.env.NEXTAUTH_URL = 'https://kima2019.org'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    process.env.ADMIN_EMAIL = originalAdminEmail
    process.env.NEXTAUTH_URL = originalNextAuthUrl
  })

  it('HEAD 요청이 성공하면 원문 링크를 유효하다고 판단한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }))

    await expect(validateLegalSource('https://www.law.go.kr/법령/출입국관리법')).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      'https://www.law.go.kr/법령/출입국관리법',
      expect.objectContaining({ method: 'HEAD' }),
    )
  })

  it('HEAD 요청이 실패하면 GET 요청으로 한 번 더 확인한다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    await expect(validateLegalSource('https://www.law.go.kr/법령/난민법')).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenLastCalledWith(
      'https://www.law.go.kr/법령/난민법',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('URL 형식이 아니면 네트워크 요청 없이 실패 처리한다', async () => {
    await expect(validateLegalSource('law.go.kr/법령/난민법')).resolves.toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('관리자에게 법령 검토 필요 메일을 보낸다', async () => {
    await notifyOutdatedLegal('legal_123')

    expect(sendEmail).toHaveBeenCalledWith(
      'admin@kima2019.org',
      '[KIMA] 법령 자료 검토 필요',
      expect.stringContaining('legal_123'),
    )
  })

  it('관리자 이메일이 없으면 알림을 보내지 않는다', async () => {
    delete process.env.ADMIN_EMAIL

    await notifyOutdatedLegal('legal_123')

    expect(sendEmail).not.toHaveBeenCalled()
  })
})
