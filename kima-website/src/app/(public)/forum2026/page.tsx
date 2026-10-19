import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { ForumRegisterForm } from '@/components/forum2026/ForumRegisterForm'
import {
  FORUM_BANK,
  FORUM_CONTACT_EMAIL,
  FORUM_DEADLINE,
  FORUM_DIRECTIONS_TEXT,
  FORUM_FEE_NOTE,
  FORUM_INFO,
  FORUM_PAYMENT_CONFIRM_TEXT,
  FORUM_REFUND_TEXT,
  isForumRegistrationOpen,
} from '@/lib/forum2026'

const OG_TITLE = `${FORUM_INFO.title} 참가 신청 — ${FORUM_INFO.subtitle}`
const OG_DESCRIPTION = `${FORUM_INFO.theme} | ${FORUM_INFO.dateText} · ${FORUM_INFO.venueName}`

export const metadata: Metadata = {
  title: `${FORUM_INFO.title} 참가 신청`,
  description: OG_DESCRIPTION,
  alternates: { canonical: '/forum2026' },
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: '/forum2026',
    siteName: 'KIMA',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/images/kima-logo.png', alt: 'KIMA 한국이주민선교연합회' }],
  },
  twitter: {
    card: 'summary',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ['/images/kima-logo.png'],
  },
}

export const dynamic = 'force-dynamic'

const DEADLINE_TEXT = FORUM_DEADLINE.toLocaleDateString('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
})

const ENCODED_ADDRESS = encodeURIComponent(FORUM_INFO.venueAddress)
const MAP_LINKS = [
  { label: '카카오맵', href: `https://map.kakao.com/link/search/${ENCODED_ADDRESS}` },
  { label: '네이버지도', href: `https://map.naver.com/p/search/${ENCODED_ADDRESS}` },
]

const PAGE_NAV = [
  { href: '#info', label: '행사 안내' },
  { href: '#form', label: '신청서' },
  { href: '#payment', label: '입금 안내' },
]

export default async function Forum2026Page() {
  const session = await auth()
  const isOpen = isForumRegistrationOpen()

  const infoRows: { label: string; value: string; sub?: string; links?: typeof MAP_LINKS; note?: string }[] = [
    { label: '일시', value: FORUM_INFO.dateText },
    { label: '장소', value: FORUM_INFO.venueName, sub: FORUM_INFO.venueAddress, links: MAP_LINKS, note: FORUM_DIRECTIONS_TEXT },
    { label: '참가비', value: FORUM_INFO.feeText, sub: FORUM_FEE_NOTE },
    { label: '주최', value: FORUM_INFO.host },
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 포스터형 행사 요약 */}
      <section className="bg-[#1B3A6B] text-white px-4 pt-12 pb-10">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-3">
            {FORUM_INFO.subtitle}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold">{FORUM_INFO.title}</h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed break-keep text-blue-50">
            {FORUM_INFO.theme}
          </p>
          <blockquote className="mt-6 border-t border-white/15 pt-5 text-sm text-blue-200 leading-relaxed break-keep">
            “{FORUM_INFO.verse}”
            <span className="block mt-1 text-[#C8922A] font-semibold">— {FORUM_INFO.verseRef}</span>
          </blockquote>
        </div>
      </section>

      {/* 페이지 내 이동 */}
      <nav aria-label="페이지 내 이동" className="bg-white border-b border-gray-100">
        <ul className="max-w-xl mx-auto px-4 flex justify-center text-sm font-medium">
          {PAGE_NAV.map((item, i) => (
            <li key={item.href} className="flex items-center">
              {i > 0 && <span className="text-gray-300 px-1" aria-hidden="true">·</span>}
              <a href={item.href} className="inline-block px-3 py-3 text-[#1B3A6B] hover:text-[#C8922A]">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <section id="info" className="scroll-mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <dl className="space-y-4">
            {infoRows.map((row) => (
              <div key={row.label} className="flex gap-4">
                <dt className="w-14 flex-shrink-0 text-sm font-semibold text-[#C8922A]">{row.label}</dt>
                <dd className="text-sm text-gray-800 break-keep">
                  <span className="font-semibold">{row.value}</span>
                  {row.sub && <span className="block text-gray-500 mt-0.5">{row.sub}</span>}
                  {row.links && (
                    <span className="mt-1.5 flex flex-wrap gap-2">
                      {row.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-[#1B3A6B] hover:bg-blue-50"
                        >
                          {link.label} 길찾기
                        </a>
                      ))}
                    </span>
                  )}
                  {row.note && <span className="block text-xs text-gray-500 mt-1.5">{row.note}</span>}
                </dd>
              </div>
            ))}
            <div className="flex gap-4">
              <dt className="w-14 flex-shrink-0 text-sm font-semibold text-[#C8922A]">프로그램</dt>
              <dd className="flex flex-wrap gap-2">
                {FORUM_INFO.program.map((item) => (
                  <span key={item} className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1B3A6B] text-xs font-medium">
                    {item}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </section>

        <section id="form" className="scroll-mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#1B3A6B]">참가 신청</h2>
            <p className="text-sm text-gray-500 mt-1">
              로그인 없이 신청할 수 있습니다. 신청 마감: {DEADLINE_TEXT}
            </p>
          </div>

          {isOpen ? (
            <ForumRegisterForm
              defaultName={session?.user?.name ?? ''}
              defaultEmail={session?.user?.email ?? ''}
              deadlineText={DEADLINE_TEXT}
            />
          ) : (
            <div className="rounded-xl bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-800">신청이 마감되었습니다.</p>
            </div>
          )}
        </section>

        <section id="payment" className="scroll-mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1B3A6B]">입금 안내</h2>
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm">
            <p className="text-gray-500">참가비 {FORUM_INFO.feeText} — {FORUM_FEE_NOTE}</p>
            <p className="mt-1 font-semibold text-[#1B3A6B] break-all">
              {FORUM_BANK.bank} {FORUM_BANK.account}
            </p>
            <p className="text-gray-500 mt-0.5">예금주: {FORUM_BANK.holder}</p>
          </div>
          <ul className="mt-4 text-sm text-gray-700 space-y-1 list-disc pl-4 leading-relaxed">
            <li>신청서에 적은 입금자명으로 입금해 주세요. 입금자명이 다르면 확인이 늦어질 수 있습니다.</li>
            <li>입금이 확인되면 신청이 확정됩니다 ({FORUM_PAYMENT_CONFIRM_TEXT}).</li>
            <li>환불: {FORUM_REFUND_TEXT}</li>
            <li>
              문의·수정·취소:{' '}
              <a href={`mailto:${FORUM_CONTACT_EMAIL}`} className="text-[#1B3A6B] underline break-all">{FORUM_CONTACT_EMAIL}</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
