import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/cron/collect-news/route'

const mocks = vi.hoisted(() => ({
  cfEnv: vi.fn(),
  runNewsCollection: vi.fn(),
}))

vi.mock('@/lib/cfEnv', () => ({
  cfEnv: mocks.cfEnv,
}))

vi.mock('@/lib/collectNews', () => ({
  runNewsCollection: mocks.runNewsCollection,
}))

function requestWithToken(token: string): Request {
  return new Request('http://localhost/api/cron/collect-news', {
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('GET /api/cron/collect-news', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.cfEnv.mockImplementation((key: string) => {
      const env: Record<string, string> = {
        CRON_SECRET: 'vercel-cron-secret',
        CRON_SECRET_TOKEN: 'worker-cron-secret',
      }
      return env[key]
    })
    mocks.runNewsCollection.mockResolvedValue({
      collected: 0,
      processed: 0,
      saved: 0,
      totalFetched: 0,
      sourceStats: [],
      envStatus: {
        GEMINI_API_KEY: true,
        NAVER_NEWS_CLIENT_ID: true,
        NAVER_NEWS_CLIENT_SECRET: true,
      },
      durationMs: 1,
    })
  })

  it('accepts the Vercel CRON_SECRET even when CRON_SECRET_TOKEN is also set', async () => {
    const response = await GET(requestWithToken('vercel-cron-secret') as never)

    expect(response.status).toBe(200)
    expect(mocks.runNewsCollection).toHaveBeenCalledOnce()
  })

  it('rejects unknown cron tokens', async () => {
    const response = await GET(requestWithToken('wrong-secret') as never)

    expect(response.status).toBe(401)
    expect(mocks.runNewsCollection).not.toHaveBeenCalled()
  })
})
