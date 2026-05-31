import { createHash } from 'node:crypto'
import type { LegalCategory, LegalSource } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { cfEnv } from '@/lib/cfEnv'

const LAW_SEARCH_API_BASE = 'https://www.law.go.kr/DRF/lawSearch.do'
const FETCH_TIMEOUT_MS = 15_000

type LawRecord = Record<string, unknown>

type SourceStat = {
  name: string
  type: string
  status: string
  documentTitle?: string
  changed?: boolean
  error?: string
}

export type LegalSourceSyncResult = {
  message?: string
  checked: number
  syncedDocuments: number
  changedSources: number
  sourceStats: SourceStat[]
  envStatus: { LAW_GO_KR_API_KEY: boolean }
  durationMs: number
}

function getLawApiKey() {
  return cfEnv('LAW_GO_KR_API_KEY') ?? cfEnv('LAW_API_KEY')
}

function getText(record: LawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).replace(/<[^>]*>/g, '').trim()
      if (text) return text
    }
  }
  return null
}

function parseLawDate(value: string | null) {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  if (digits.length < 8) return null

  const year = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day = digits.slice(6, 8)
  const date = new Date(`${year}-${month}-${day}T00:00:00+09:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function mapLawCategory(title: string): LegalCategory {
  if (/다문화가족지원법|다문화/.test(title)) return 'MULTICULTURAL_FAMILY'
  if (/출입국|국적법|국적/.test(title)) return 'IMMIGRATION'
  if (/비자|사증|체류자격/.test(title)) return 'VISA_POLICY'
  if (/난민/.test(title)) return 'REFUGEE'
  if (/외국인근로자|고용허가|근로자/.test(title)) return 'EMPLOYMENT'
  if (/사회보장|복지|건강보험|긴급지원/.test(title)) return 'SOCIAL_WELFARE'
  return 'OTHER'
}

function normalizeLawRecord(record: LawRecord, fallbackKeyword: string) {
  const title = getText(record, ['법령명한글', '법령명', 'lawNm', '법령명_한글']) ?? fallbackKeyword
  const sourceId = getText(record, ['법령ID', 'ID', 'id', '법령일련번호', 'MST'])
  const lawType = getText(record, ['법령구분명', '법령구분', '법령종류', 'lawType'])
  const effectiveDate = parseLawDate(getText(record, ['시행일자', '시행일', 'effectiveDate']))
  const detailLink = getText(record, ['법령상세링크', '상세링크', 'link'])

  return {
    title,
    sourceId,
    lawType,
    effectiveDate,
    sourceUrl: detailLink
      ? detailLink.startsWith('http')
        ? detailLink
        : `https://www.law.go.kr${detailLink.startsWith('/') ? '' : '/'}${detailLink}`
      : `https://www.law.go.kr/법령/${encodeURIComponent(title)}`,
    category: mapLawCategory(title),
  }
}

function toArray(value: unknown): LawRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is LawRecord => typeof item === 'object' && item !== null)
  if (typeof value === 'object' && value !== null) return [value as LawRecord]
  return []
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'User-Agent': 'KIMA legal source sync (+https://kima2019.org)',
        ...(init.headers ?? {}),
      },
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchLawList(keyword: string): Promise<LawRecord[]> {
  const apiKey = getLawApiKey()
  if (!apiKey) throw new Error('LAW_GO_KR_API_KEY 환경변수가 필요합니다.')

  const params = new URLSearchParams({
    OC: apiKey,
    target: 'eflaw',
    type: 'JSON',
    query: keyword,
    nw: '2,3',
    sort: 'efdes',
    display: '20',
    page: '1',
  })

  const res = await fetchWithTimeout(`${LAW_SEARCH_API_BASE}?${params}`)
  if (!res.ok) throw new Error(`법제처 API 응답 오류: ${res.status}`)

  const data = await res.json() as { LawSearch?: { law?: unknown } }
  return toArray(data.LawSearch?.law)
}

function buildDocumentContent(source: LegalSource, title: string) {
  return `# ${title}

이 문서는 공식 출처의 최신성 확인을 돕기 위해 자동 동기화된 법령 항목입니다.

## 공식 출처

- [${source.name}](${source.url})

KIMA 해설은 별도 검토 후 보완됩니다. 최신 조문과 법적 효력이 있는 원문은 국가법령정보센터를 기준으로 확인하세요.
`
}

function buildDocumentSections(source: LegalSource, title: string) {
  return [
    {
      type: 'OVERVIEW' as const,
      title: '한눈에 보기',
      content: `## 공식 출처 기반 자동 항목

${title}의 최신 여부를 공식 출처 기준으로 확인합니다.
`,
      accessLevel: 'PUBLIC' as const,
      order: 0,
      authorName: 'KIMA',
    },
    {
      type: 'SOURCE_LINKS' as const,
      title: '법령 원문 링크',
      content: `## 공식 원문

- [${source.name}](${source.url})
`,
      accessLevel: 'PUBLIC' as const,
      order: 1,
      authorName: 'KIMA',
    },
  ]
}

async function syncLawApiSource(source: LegalSource) {
  const keyword = source.apiKeyword ?? source.name
  const laws = await fetchLawList(keyword)
  const normalized = laws.map((law) => normalizeLawRecord(law, keyword))
  const law = normalized.find((item) => item.title.replace(/\s/g, '') === keyword.replace(/\s/g, ''))
    ?? normalized.find((item) => item.title.includes(keyword) || keyword.includes(item.title))
    ?? normalized[0]

  if (!law) {
    await prisma.legalSource.update({
      where: { id: source.id },
      data: { lastCheckedAt: new Date(), lastStatus: 'not_found', lastError: '검색 결과 없음' },
    })
    return { status: 'not_found', synced: false, changed: false }
  }

  const existing = law.sourceId
    ? await prisma.legalDocument.findFirst({ where: { sourceId: law.sourceId } })
    : await prisma.legalDocument.findFirst({ where: { title: law.title, category: law.category } })

  const changed = !existing ||
    existing.title !== law.title ||
    existing.lawType !== law.lawType ||
    existing.sourceUrl !== law.sourceUrl ||
    existing.sourceId !== law.sourceId ||
    existing.effectiveDate?.getTime() !== law.effectiveDate?.getTime()

  if (existing) {
    await prisma.legalDocument.update({
      where: { id: existing.id },
      data: {
        title: law.title,
        category: law.category,
        lawType: law.lawType,
        effectiveDate: law.effectiveDate,
        sourceUrl: law.sourceUrl,
        sourceId: law.sourceId,
        accessLevel: 'PUBLIC',
        isLatest: true,
      },
    })
  } else {
    await prisma.legalDocument.create({
      data: {
        title: law.title,
        summary: `${source.name}에서 자동 확인한 공식 법령 출처입니다.`,
        content: buildDocumentContent(source, law.title),
        category: law.category,
        lawType: law.lawType,
        effectiveDate: law.effectiveDate,
        sourceUrl: law.sourceUrl,
        sourceId: law.sourceId,
        accessLevel: 'PUBLIC',
        isLatest: true,
        sections: { create: buildDocumentSections(source, law.title) },
      },
    })
  }

  await prisma.legalSource.update({
    where: { id: source.id },
    data: {
      lastCheckedAt: new Date(),
      lastSyncedAt: new Date(),
      lastChangedAt: changed ? new Date() : source.lastChangedAt,
      lastStatus: changed ? 'updated' : 'ok',
      lastError: null,
    },
  })

  return { status: changed ? 'updated' : 'ok', synced: true, changed, documentTitle: law.title }
}

async function checkWebSource(source: LegalSource) {
  const res = await fetchWithTimeout(source.url, { method: 'GET' })
  if (!res.ok) throw new Error(`출처 응답 오류: ${res.status}`)

  const text = await res.text()
  const nextHash = createHash('sha256').update(text).digest('hex')
  const changed = !!source.contentHash && source.contentHash !== nextHash

  await prisma.legalSource.update({
    where: { id: source.id },
    data: {
      contentHash: nextHash,
      lastCheckedAt: new Date(),
      lastChangedAt: changed ? new Date() : source.lastChangedAt,
      lastStatus: changed ? 'changed' : 'ok',
      lastError: null,
    },
  })

  return { status: changed ? 'changed' : 'ok', synced: false, changed }
}

export async function runLegalSourceSync(): Promise<LegalSourceSyncResult> {
  const startAt = Date.now()
  const envStatus = { LAW_GO_KR_API_KEY: !!getLawApiKey() }
  const sourceStats: SourceStat[] = []
  let syncedDocuments = 0
  let changedSources = 0

  const sources = await prisma.legalSource.findMany({
    where: { isEnabled: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  if (sources.length === 0) {
    return {
      message: '활성화된 법령 출처가 없습니다.',
      checked: 0,
      syncedDocuments: 0,
      changedSources: 0,
      sourceStats: [],
      envStatus,
      durationMs: Date.now() - startAt,
    }
  }

  for (const source of sources) {
    try {
      if (source.sourceType === 'LAW_API') {
        const result = await syncLawApiSource(source)
        if (result.synced) syncedDocuments++
        if (result.changed) changedSources++
        sourceStats.push({
          name: source.name,
          type: source.sourceType,
          status: result.status,
          documentTitle: result.documentTitle,
          changed: result.changed,
        })
      } else {
        const result = await checkWebSource(source)
        if (result.changed) changedSources++
        sourceStats.push({
          name: source.name,
          type: source.sourceType,
          status: result.status,
          changed: result.changed,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await prisma.legalSource.update({
        where: { id: source.id },
        data: { lastCheckedAt: new Date(), lastStatus: 'error', lastError: message },
      }).catch(() => null)
      sourceStats.push({ name: source.name, type: source.sourceType, status: 'error', error: message })
    }
  }

  return {
    checked: sources.length,
    syncedDocuments,
    changedSources,
    sourceStats,
    envStatus,
    durationMs: Date.now() - startAt,
  }
}
