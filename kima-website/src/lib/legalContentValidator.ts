import { sendEmail } from '@/lib/email'

const DEFAULT_TIMEOUT_MS = 10_000

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    return await fetch(url, {
      redirect: 'follow',
      cache: 'no-store',
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function isValidHttpUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function validateLegalSource(sourceUrl: string): Promise<boolean> {
  if (!isValidHttpUrl(sourceUrl)) return false

  try {
    const headResponse = await fetchWithTimeout(sourceUrl, { method: 'HEAD' })
    if (headResponse.ok) return true

    const getResponse = await fetchWithTimeout(sourceUrl, { method: 'GET' })
    return getResponse.ok
  } catch {
    return false
  }
}

export async function notifyOutdatedLegal(documentId: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  const siteUrl = process.env.NEXTAUTH_URL ?? 'https://kima2019.org'
  const documentUrl = `${siteUrl}/admin/legal`

  await sendEmail(
    adminEmail,
    '[KIMA] 법령 자료 검토 필요',
    `
      <p>법령 자료의 원문 링크 또는 최신성 검토가 필요합니다.</p>
      <ul>
        <li><strong>법령 ID:</strong> ${documentId}</li>
        <li><strong>관리 화면:</strong> <a href="${documentUrl}">${documentUrl}</a></li>
      </ul>
    `,
  )
}
