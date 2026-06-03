import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kima2019.org'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 정적 공개 페이지
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about/history`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about/vision`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about/leadership`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about/brand`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE_URL}/directory`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/story`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/data`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/donate`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // 단체 디렉토리 상세 페이지 (공개 단체만)
  const organizations = await prisma.organization.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
  }).catch(() => [])

  const orgRoutes: MetadataRoute.Sitemap = organizations.map((org) => ({
    url: `${BASE_URL}/directory/${org.id}`,
    lastModified: org.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // 스토리 (공개 승인된 스토리만)
  const stories = await prisma.story.findMany({
    where: { isPublished: true, status: 'APPROVED' },
    select: { id: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }).catch(() => [])

  const storyRoutes: MetadataRoute.Sitemap = stories.map((post) => ({
    url: `${BASE_URL}/story/${post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const legalTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass('public."LegalDocument"') IS NOT NULL AS "exists"
  `.catch(() => [])

  const legalDocuments = legalTable[0]?.exists
    ? await prisma.legalDocument.findMany({
        where: { accessLevel: 'PUBLIC' },
        select: { id: true, updatedAt: true, isLatest: true },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      }).catch(() => [])
    : []

  const legalRoutes: MetadataRoute.Sitemap = legalDocuments.map((document) => ({
    url: `${BASE_URL}/legal/${document.id}`,
    lastModified: document.updatedAt,
    changeFrequency: document.isLatest ? 'monthly' as const : 'yearly' as const,
    priority: document.isLatest ? 0.6 : 0.3,
  }))

  return [...staticRoutes, ...orgRoutes, ...storyRoutes, ...legalRoutes]
}
