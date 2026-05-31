import Link from 'next/link'
import type { AccessLevel, LegalSectionType } from '@prisma/client'
import {
  ACCESS_LEVEL_META,
  LEGAL_SECTION_META,
  formatLegalDate,
} from '@/lib/legalCategories'
import { cn } from '@/lib/utils'
import { LegalMarkdown } from '@/components/legal/LegalMarkdown'

interface LegalSectionBlockProps {
  documentId: string
  section: {
    type: LegalSectionType
    title: string
    content: string
    accessLevel: AccessLevel
    authorName: string | null
    reviewedAt: Date | string | null
  }
  canRead: boolean
  isAuthenticated: boolean
  sourceUrl?: string | null
}

function lockedCopy(accessLevel: AccessLevel, isAuthenticated: boolean) {
  if (accessLevel === 'PREMIUM') {
    return {
      title: '정회원 전용 자료입니다',
      description: isAuthenticated
        ? '정회원 승인 후 전문가 해설과 복잡 사례 자료를 확인할 수 있습니다.'
        : '로그인 후 정회원 권한을 확인하면 전문가 해설과 복잡 사례 자료를 볼 수 있습니다.',
      href: isAuthenticated ? '/member/upgrade' : null,
      label: isAuthenticated ? '정회원 안내 보기' : '로그인하기',
    }
  }

  return {
    title: '회원 전용 해설입니다',
    description: '로그인한 회원은 사역 현장 FAQ와 절차 안내를 확인할 수 있습니다.',
    href: null,
    label: '로그인하기',
  }
}

export function LegalSectionBlock({
  documentId,
  section,
  canRead,
  isAuthenticated,
  sourceUrl,
}: LegalSectionBlockProps) {
  const access = ACCESS_LEVEL_META[section.accessLevel]
  const typeMeta = LEGAL_SECTION_META[section.type]
  const reviewedAt = formatLegalDate(section.reviewedAt)
  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(`/legal/${documentId}`)}`
  const lock = lockedCopy(section.accessLevel, isAuthenticated)
  const ctaHref = lock.href ?? loginHref

  return (
    <section className="mt-6 rounded-xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#C8922A]">{typeMeta.label}</p>
          <h2 className="mt-1 text-lg font-bold text-[#1B3A6B]">{section.title}</h2>
        </div>
        <span className={cn('w-fit px-2.5 py-0.5 rounded-full border text-xs font-medium', access.className)}>
          {access.label}
        </span>
      </div>

      {canRead ? (
        <>
          {section.type === 'SOURCE_LINKS' && sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm font-semibold text-[#1B3A6B] hover:underline"
            >
              국가법령정보센터 원문 보기
            </a>
          )}
          {section.type === 'SOURCE_LINKS' && !sourceUrl && (
            <p className="text-sm text-gray-500">공식 원문 링크를 준비 중입니다.</p>
          )}
          {section.type !== 'SOURCE_LINKS' && (
            <LegalMarkdown content={section.content} />
          )}
          {section.type !== 'SOURCE_LINKS' && (section.authorName || reviewedAt) && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-400">
              {section.authorName && <span>작성 {section.authorName}</span>}
              {reviewedAt && <span>검토 {reviewedAt}</span>}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-5">
          <p className="text-sm font-semibold text-gray-800">{lock.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">{lock.description}</p>
          <Link
            href={ctaHref}
            className="mt-4 inline-flex rounded-lg bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#15305a] transition-colors"
          >
            {lock.label}
          </Link>
        </div>
      )}
    </section>
  )
}
