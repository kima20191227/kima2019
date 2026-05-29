/**
 * Cloudflare Pages 환경변수 읽기 헬퍼
 *
 * require('@opennextjs/cloudflare') → ESM 패키지라 Cloudflare 번들에서 실패.
 * 정적 import로 변경: getCloudflareContext()를 직접 import하고,
 * 로컬/컨텍스트 외부에서 throw되면 process.env로 fallback.
 */
import { getCloudflareContext } from '@opennextjs/cloudflare'

export function cfEnv(key: string): string | undefined {
  try {
    const ctx = getCloudflareContext()
    const val = (ctx.env as Record<string, string | undefined>)[key]
    if (val) return val
  } catch {
    // 로컬 개발 환경 또는 request context 외부 호출 → process.env fallback
  }
  return process.env[key]
}
