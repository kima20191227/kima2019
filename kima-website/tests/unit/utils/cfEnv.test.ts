import { afterEach, describe, expect, it } from 'vitest'
import { cfEnv, cfEnvSource, hasCloudflareEnv } from '@/lib/cfEnv'

const contextSymbol = Symbol.for('__cloudflare-context__')

afterEach(() => {
  Reflect.deleteProperty(globalThis, contextSymbol)
  delete process.env.CF_ENV_TEST_KEY
  delete process.env.CF_ENV_OBJECT_KEY
})

describe('cfEnv', () => {
  it('prefers the Cloudflare request context over process.env', () => {
    process.env.CF_ENV_TEST_KEY = 'from-process'
    Reflect.set(globalThis, contextSymbol, {
      env: { CF_ENV_TEST_KEY: 'from-cloudflare' },
    })

    expect(cfEnv('CF_ENV_TEST_KEY')).toBe('from-cloudflare')
    expect(cfEnvSource('CF_ENV_TEST_KEY')).toBe('cloudflare')
    expect(hasCloudflareEnv()).toBe(true)
  })

  it('falls back to process.env outside the Cloudflare runtime', () => {
    process.env.CF_ENV_TEST_KEY = 'from-process'

    expect(cfEnv('CF_ENV_TEST_KEY')).toBe('from-process')
    expect(cfEnvSource('CF_ENV_TEST_KEY')).toBe('process')
    expect(hasCloudflareEnv()).toBe(false)
  })

  it('returns JSON text for object bindings', () => {
    Reflect.set(globalThis, contextSymbol, {
      env: { CF_ENV_OBJECT_KEY: { client_email: 'svc@example.com' } },
    })

    expect(cfEnv('CF_ENV_OBJECT_KEY')).toBe('{"client_email":"svc@example.com"}')
  })
})
