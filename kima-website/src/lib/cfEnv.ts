type CloudflareContext = {
  env?: Record<string, unknown>
}

export type CfEnvSource = 'cloudflare' | 'process' | 'missing'

const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__')

function stringifyEnvValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() ? value : undefined
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value == null) return undefined

  try {
    return JSON.stringify(value)
  } catch {
    return undefined
  }
}

function readCloudflareEnv(key: string): string | undefined {
  const context = Reflect.get(globalThis, CLOUDFLARE_CONTEXT_SYMBOL) as CloudflareContext | undefined
  return stringifyEnvValue(context?.env?.[key])
}

function readProcessEnv(key: string): string | undefined {
  if (typeof process === 'undefined') return undefined
  return stringifyEnvValue(process.env[key])
}

export function cfEnv(key: string): string | undefined {
  return readCloudflareEnv(key) ?? readProcessEnv(key)
}

export function cfEnvSource(key: string): CfEnvSource {
  if (readCloudflareEnv(key) !== undefined) return 'cloudflare'
  if (readProcessEnv(key) !== undefined) return 'process'
  return 'missing'
}

export function hasCloudflareEnv(): boolean {
  const context = Reflect.get(globalThis, CLOUDFLARE_CONTEXT_SYMBOL) as CloudflareContext | undefined
  return !!context?.env
}
