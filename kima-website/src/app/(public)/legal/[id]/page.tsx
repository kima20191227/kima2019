import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  ACCESS_LEVEL_META,
  LEGAL_CATEGORY_META,
  getAllowedLegalAccessLevels,
} from '@/lib/legalCategories'
import { LegalDisclaimer } from '@/components/legal/LegalDisclaimer'
import { LegalSectionBlock } from '@/components/legal/LegalSectionBlock'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const document = await prisma.legalDocument.findFirst({
    where: { id, accessLevel: 'PUBLIC' },
    select: { title: true, summary: true },
  }).catch(() => null)

  if (!document) {
    return {
      title: '법령&제도 | KIMA',
    }
  }

  return {
    title: `${document.title} | KIMA 법령&제도`,
    description: document.summary ?? undefined,
  }
}

export default async function LegalDetailPage({ params }: PageProps) {
  const { id } = await params

  const document = await prisma.legalDocument.findFirst({
    where: { id, accessLevel: 'PUBLIC' },
    include: { sections: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  }).catch(() => null)

  if (!document) notFound()

  const session = await auth()
  const allowedAccessLevels = getAllowedLegalAccessLevels(session?.user?.role)
  const isAuthenticated = !!session?.user?.id

  await prisma.legalDocument.update({
    where: { id: document.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => null)

  const category = LEGAL_CATEGORY_META[document.category]
  const access = ACCESS_LEVEL_META[document.accessLevel]
  const sourceSections = document.sections.filter((section) => section.type === 'SOURCE_LINKS')
  const sections = sourceSections.length > 0
    ? sourceSections
    : [
        {
          type: 'SOURCE_LINKS' as const,
          title: '법령 원문 링크',
          content: '',
          accessLevel: 'PUBLIC' as const,
          authorName: 'KIMA',
          reviewedAt: document.updatedAt,
        },
      ]

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">
            Legal Guide
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug">{document.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-semibold bg-white', category.className)}>
              {category.label}
            </span>
            {document.lawType && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-blue-100">
                {document.lawType}
              </span>
            )}
            <span className={cn('px-2.5 py-0.5 rounded-full border text-xs font-medium bg-white', access.className)}>
              {access.label}
            </span>
            {document.isLatest ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#C8922A] text-white text-xs font-semibold">
                최신
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-blue-100">
                이전 버전
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {sections.map((section) => (
          <LegalSectionBlock
            key={`${section.type}-${section.title}`}
            documentId={document.id}
            section={section}
            canRead={allowedAccessLevels.includes(section.accessLevel)}
            isAuthenticated={isAuthenticated}
            sourceUrl={document.sourceUrl}
          />
        ))}

        <LegalDisclaimer updatedAt={document.updatedAt} sourceUrl={document.sourceUrl} />

        <div className="mt-8">
          <Link href="/legal" className="text-sm text-gray-500 hover:text-gray-700">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  )
}
