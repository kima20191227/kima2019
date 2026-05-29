/**
 * Cloudflare Workers Cron Handler
 *
 * 배포: npx wrangler deploy src/workers/cron.ts --name kima-cron
 *
 * 트리거 (Cloudflare 대시보드 → Workers → kima-cron → Triggers):
 *   "0 0 * * *"  — UTC 00:00 = KST 09:00 (회원 만료·이벤트 리마인더)
 *   "0 23 * * *" — UTC 23:00 = KST 08:00 (뉴스 자동 수집)
 *
 * 환경변수 (Cloudflare 대시보드 → Workers → kima-cron → Settings → Variables):
 *   CRON_SECRET        기존 크론 엔드포인트 인증 토큰
 *   CRON_SECRET_TOKEN  뉴스 수집 엔드포인트 인증 토큰 (CRON_SECRET과 동일하게 설정 가능)
 *   SITE_URL           https://kima2019.org
 */

interface Env {
  CRON_SECRET:       string
  CRON_SECRET_TOKEN: string   // /api/cron/collect-news 인증용 (미설정 시 CRON_SECRET 사용)
  SITE_URL:          string
}

/** UTC 00:00 에 실행되는 일반 크론 작업 */
const DAILY_JOBS = [
  '/api/cron/expiring-members',
  '/api/cron/event-reminders',
] as const

/** UTC 23:00 에 실행되는 뉴스 수집 작업 */
const NEWS_COLLECT_PATH = '/api/cron/collect-news'

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const siteUrl    = env.SITE_URL          ?? 'https://kima2019.org'
    const secret     = env.CRON_SECRET       ?? ''
    const newsSecret = env.CRON_SECRET_TOKEN ?? secret  // 미설정 시 CRON_SECRET 사용

    const cron = event.cron  // e.g. "0 23 * * *"
    const isNewsCron = cron === '0 23 * * *'

    if (isNewsCron) {
      // ── 뉴스 자동 수집 (UTC 23:00 = KST 08:00) ──────────────────────────
      try {
        const res = await fetch(`${siteUrl}${NEWS_COLLECT_PATH}`, {
          method:  'GET',
          headers: {
            Authorization:   `Bearer ${newsSecret}`,
            'Content-Type':  'application/json',
          },
        })
        const body = await res.json()
        console.log(`[cron] ${NEWS_COLLECT_PATH} → ${res.status}`, body)
      } catch (err) {
        console.error('[cron] 뉴스 수집 실패:', err)
      }
    } else {
      // ── 일반 크론 작업 (UTC 00:00 = KST 09:00) ──────────────────────────
      const results = await Promise.allSettled(
        DAILY_JOBS.map((path) =>
          fetch(`${siteUrl}${path}`, {
            method:  'GET',
            headers: {
              Authorization:   `Bearer ${secret}`,
              'Content-Type':  'application/json',
            },
          }).then(async (res) => ({
            path,
            status: res.status,
            body:   await res.json(),
          })),
        ),
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          console.log(
            `[cron] ${result.value.path} → ${result.value.status}`,
            result.value.body,
          )
        } else {
          console.error('[cron] 실패:', result.reason)
        }
      }
    }

    void ctx
  },
} satisfies ExportedHandler<Env>
