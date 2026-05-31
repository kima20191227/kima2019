import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LegalDocumentAdminClient } from '@/components/admin/LegalDocumentAdminClient'
import type { LegalDocumentAdminItem } from '@/components/admin/LegalDocumentAdminClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '법령&제도 관리 | KIMA 관리자',
}

export default async function AdminLegalPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/')

  const documents = await prisma.legalDocument.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    include: { sections: { orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] } },
  }).catch(() => [])

  const serialized: LegalDocumentAdminItem[] = documents.map((document) => ({
    ...document,
    effectiveDate: document.effectiveDate?.toISOString() ?? null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    sections: document.sections.map((section) => ({
      ...section,
      reviewedAt: section.reviewedAt?.toISOString() ?? null,
      createdAt: section.createdAt.toISOString(),
      updatedAt: section.updatedAt.toISOString(),
    })),
  }))

  const publicCount = documents.filter((document) => document.accessLevel === 'PUBLIC').length
  const latestCount = documents.filter((document) => document.isLatest).length

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">법령&제도 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            전체 {documents.length}건 · 공개 {publicCount}건 · 최신 {latestCount}건
          </p>
        </div>
        <a
          href="/legal"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-[#1B3A6B] underline hover:text-[#15305a]"
        >
          공개 페이지 보기
        </a>
      </div>

      <LegalDocumentAdminClient documents={serialized} />
    </div>
  )
}
