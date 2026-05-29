import { afterEach, describe, expect, it, vi } from 'vitest'
import { processBatch } from '@/lib/aiSummarizer'
import type { RawArticle } from '@/lib/newsCollector'

function article(index: number): RawArticle {
  return {
    title: `Migrant worker article ${index}`,
    summary: `Foreign worker support summary ${index}`,
    url: `https://example.com/news/${index}`,
    sourceName: 'Test Source',
    publishedAt: new Date('2026-05-29T00:00:00.000Z'),
    keywords: ['migration'],
  }
}

async function flushMicrotasks(times = 8) {
  for (let i = 0; i < times; i++) await Promise.resolve()
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete process.env.GEMINI_API_KEY
})

describe('processBatch', () => {
  it('does not wait between fallback articles when Gemini is not configured', async () => {
    vi.useFakeTimers()

    let settled = false
    const promise = processBatch([article(1), article(2)]).then((result) => {
      settled = true
      return result
    })

    await flushMicrotasks()

    expect(settled).toBe(true)
    await expect(promise).resolves.toHaveLength(2)
  })

  it('does not keep sleeping after Gemini enters fallback mode', async () => {
    vi.useFakeTimers()
    process.env.GEMINI_API_KEY = 'test-key'
    const fetchMock = vi.fn(async () => new Response('quota exceeded', { status: 429 }))
    vi.stubGlobal('fetch', fetchMock)

    let settled = false
    const promise = processBatch([article(1), article(2)]).then((result) => {
      settled = true
      return result
    })

    await flushMicrotasks()

    expect(settled).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await expect(promise).resolves.toHaveLength(2)
  })
})
