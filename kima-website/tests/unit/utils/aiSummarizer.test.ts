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

// 가짜 타이머가 설치된 상태에서 sleep()이 걸리면 그 프라미스는 타이머를 진행시키기 전까지
// 절대 resolve되지 않는다. 따라서 마이크로태스크를 아무리 많이 돌려도 "sleep 하지 않는다"는
// 검증은 약해지지 않는다. (429 응답 본문을 읽는 res.text()가 소비하는 tick 수가
// 구현이 아니라 undici 내부 사정에 좌우되므로 고정 횟수 대신 settle 여부로 대기한다.)
async function flushUntilSettled(isSettled: () => boolean, maxTicks = 1000) {
  for (let i = 0; i < maxTicks && !isSettled(); i++) await Promise.resolve()
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

    await flushUntilSettled(() => settled)

    // 폴백 진입 후 sleep(BATCH_DELAY_MS)이 예약되지 않았음을 직접 확인한다.
    expect(vi.getTimerCount()).toBe(0)
    expect(settled).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await expect(promise).resolves.toHaveLength(2)
  })
})
