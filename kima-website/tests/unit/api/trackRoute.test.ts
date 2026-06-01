import { describe, expect, it } from 'vitest'
import { isAllowedOrigin } from '@/lib/allowedOrigin'

function requestWithHost(host: string) {
  return {
    headers: {
      get: (name: string) => (name.toLowerCase() === 'host' ? host : null),
    },
  } as never
}

describe('isAllowedOrigin', () => {
  it('allows exact production origins', () => {
    expect(isAllowedOrigin('https://kima2019.org', requestWithHost('kima2019.org'))).toBe(true)
    expect(isAllowedOrigin('https://www.kima2019.org', requestWithHost('www.kima2019.org'))).toBe(true)
  })

  it('rejects domains that only start with an allowed domain', () => {
    expect(isAllowedOrigin('https://kima2019.org.evil.example', requestWithHost('kima2019.org'))).toBe(false)
  })

  it('allows the current request host and local development hosts', () => {
    expect(isAllowedOrigin('https://preview.example.com', requestWithHost('preview.example.com'))).toBe(true)
    expect(isAllowedOrigin('http://127.0.0.1:3100', requestWithHost('127.0.0.1:3100'))).toBe(true)
  })
})
