/**
 * Cloudflare Workers Cron Handler
 *
 * Deploy:
 *   npx wrangler deploy src/workers/cron.ts --name kima-cron
 *
 * Cron trigger:
 *   "0 0 * * *"  - UTC 00:00 = KST 09:00
 *
 * Environment variables:
 *   CRON_SECRET        Auth token for cron endpoints
 *   CRON_SECRET_TOKEN  Optional legacy/news token. If omitted, CRON_SECRET is used.
 *   SITE_URL           https://www.kima2019.org
 */

interface Env {
  CRON_SECRET: string
  CRON_SECRET_TOKEN?: string
  SITE_URL?: string
}

const DAILY_JOBS = [
  '/api/cron/expiring-members',
  '/api/cron/event-reminders',
  '/api/cron/sync-legal-sources',
  '/api/cron/collect-news',
] as const

function tokenForPath(path: string, env: Env): string {
  if (path === '/api/cron/collect-news' || path === '/api/cron/sync-legal-sources') {
    return env.CRON_SECRET_TOKEN ?? env.CRON_SECRET ?? ''
  }
  return env.CRON_SECRET ?? ''
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron !== '0 0 * * *') {
      console.log(`[cron] skipped unsupported schedule: ${event.cron}`)
      return
    }

    const siteUrl = env.SITE_URL ?? 'https://www.kima2019.org'
    const results = await Promise.allSettled(
      DAILY_JOBS.map((path) =>
        fetch(`${siteUrl}${path}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenForPath(path, env)}`,
            'Content-Type': 'application/json',
          },
        }).then(async (res) => ({
          path,
          status: res.status,
          body: await res.json(),
        })),
      ),
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        console.log(`[cron] ${result.value.path} -> ${result.value.status}`, result.value.body)
      } else {
        console.error('[cron] failed:', result.reason)
      }
    }

    void ctx
  },
} satisfies ExportedHandler<Env>
