import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { ForumRegisterForm } from '@/components/forum2026/ForumRegisterForm'
import { FORUM_DEADLINE, FORUM_INFO, isForumRegistrationOpen } from '@/lib/forum2026'

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

export default async function Forum2026Page() {
  const session = await auth()
  const isOpen = isForumRegistrationOpen()

  const infoRows = [
    { label: '일시', value: FORUM_INFO.dateText },
    { label: '장소', value: FORUM_INFO.venueName, sub: FORUM_INFO.venueAddress },
    { label: '참가비', value: FORUM_INFO.feeText },
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

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <dl className="space-y-4">
            {infoRows.map((row) => (
              <div key={row.label} className="flex gap-4">
                <dt className="w-14 flex-shrink-0 text-sm font-semibold text-[#C8922A]">{row.label}</dt>
                <dd className="text-sm text-gray-800 break-keep">
                  <span className="font-semibold">{row.value}</span>
                  {row.sub && <span className="block text-gray-500 mt-0.5">{row.sub}</span>}
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

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
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
            />
          ) : (
            <div className="rounded-xl bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-800">신청이 마감되었습니다.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
