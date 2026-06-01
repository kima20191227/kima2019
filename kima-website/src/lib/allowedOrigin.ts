const ALLOWED_ORIGINS = [
  'https://kima2019.org',
  'https://www.kima2019.org',
  'http://localhost:3000',
]

type HeaderReader = {
  headers: {
    get(name: string): string | null
  }
}

export function isAllowedOrigin(origin: string, request: HeaderReader) {
  try {
    const originUrl = new URL(origin)
    if (ALLOWED_ORIGINS.includes(originUrl.origin)) return true

    const requestHost = request.headers.get('host')

    if (requestHost && originUrl.host === requestHost) return true
    return originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1'
  } catch {
    return false
  }
}
