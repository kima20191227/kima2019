/**
 * Cloudflare Pages 환경변수 읽기 헬퍼
 * getCloudflareContext().env 우선 → process.env fallback
 *
 * 사용 이유:
 *   @opennextjs/cloudflare(cloudflare-node) 환경에서
 *   process.env 패칭이 일부 변수에 적용되지 않는 경우가 있음.
 *   Cloudflare 바인딩에서 직접 읽어 이를 우회한다.
 */
export function cfEnv(key: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare')
    const ctx = getCloudflareContext() as { env?: Record<string, string | undefined> }
    const val = ctx?.env?.[key]
    if (val) return val
  } catch {
    // 로컬 개발 환경 또는 getCloudflareContext 미지원 — 무시
  }
  return process.env[key]
}
