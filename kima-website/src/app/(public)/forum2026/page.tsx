import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ForumRegisterForm } from '@/components/forum2026/ForumRegisterForm'
import { VideoEmbed } from '@/components/story/VideoEmbed'
import {
  FORUM_BANK,
  FORUM_CAR_ROUTE,
  FORUM_CHECKIN_TEXT,
  FORUM_CONTACT_EMAIL,
  FORUM_TRANSIT,
  FORUM_VENUE_PHONE,
  FORUM_DEADLINE,
  FORUM_DIRECTIONS_TEXT,
  FORUM_FEE_NOTE,
  FORUM_INFO,
  FORUM_MISSIONFUND_URL,
  FORUM_PAYMENT_CONFIRM_TEXT,
  FORUM_PROMO_VIDEO_URL,
  FORUM_REFUND_TEXT,
  isForumRegistrationOpen,
} from '@/lib/forum2026'
import { FORUM_SURVEY_OPENS_TEXT, getForumSurveyState } from '@/lib/forumSurvey'

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
  { href: '#directions', label: '오시는 길' },
  { href: '#video', label: '홍보영상' },
  { href: '#form', label: '신청서' },
  { href: '#payment', label: '입금 안내' },
  { href: '#missionfund', label: '미션펀드 후원' },
  { href: '#survey', label: '피드백 설문' },
]

export default async function Forum2026Page() {
  const session = await auth()
  const isOpen = isForumRegistrationOpen()
  const surveyState = getForumSurveyState()

  const infoRows: { label: string; value: string; sub?: string; links?: typeof MAP_LINKS; note?: string }[] = [
    { label: '일시', value: FORUM_INFO.dateText },
    { label: '장소', value: FORUM_INFO.venueName, sub: FORUM_INFO.venueAddress, links: MAP_LINKS, note: FORUM_DIRECTIONS_TEXT },
    { label: '참가비', value: FORUM_INFO.feeText, sub: FORUM_FEE_NOTE },
    { label: '주최', value: FORUM_INFO.host },
  ]

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 포스터 */}
      <section className="bg-[#1B3A6B] px-4 pt-8 pb-8">
        <h1 className="sr-only">{`${FORUM_INFO.title} — ${FORUM_INFO.theme}`}</h1>
        <div className="max-w-xs sm:max-w-sm mx-auto">
          <Image
            src="/images/forum2026-poster.jpg"
            alt={`${FORUM_INFO.title} (${FORUM_INFO.subtitle}) 포스터 — ${FORUM_INFO.dateText}, ${FORUM_INFO.venueName}`}
            width={1200}
            height={1697}
            priority
            className="w-full h-auto rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* 페이지 내 이동 */}
      <nav aria-label="페이지 내 이동" className="bg-white border-b border-gray-100">
        <ul className="max-w-xl mx-auto px-2 flex flex-nowrap overflow-x-auto sm:justify-center text-[13px] sm:text-sm font-medium whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {PAGE_NAV.map((item, i) => (
            <li key={item.href} className="flex items-center flex-shrink-0">
              {i > 0 && <span className="text-gray-300" aria-hidden="true">·</span>}
              <a href={item.href} className="inline-block px-2 sm:px-3 py-3 text-[#1B3A6B] hover:text-[#C8922A]">
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

        <section id="directions" className="scroll-mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1B3A6B]">오시는 길</h2>
          <p className="mt-2 text-sm text-gray-800">
            <span className="font-semibold">{FORUM_INFO.venueName}</span>
            <span className="block text-gray-500">{FORUM_INFO.venueAddress}</span>
            <span className="block text-gray-500">
              문의 ·{' '}
              <a href="tel:0316680550" className="text-[#1B3A6B] underline">{FORUM_VENUE_PHONE}</a>
            </span>
          </p>

          <Image
            src="/images/forum2026-map.png"
            alt={`${FORUM_INFO.venueName} 위치 지도 — ${FORUM_INFO.venueAddress}`}
            width={698}
            height={697}
            className="mt-4 w-full h-auto rounded-lg border border-gray-200"
          />

          <h3 className="mt-5 text-sm font-semibold text-[#C8922A]">대중교통</h3>
          <p className="mt-1 text-sm text-gray-800 leading-relaxed break-keep">{FORUM_TRANSIT.summary}</p>
          <p className="mt-1 text-sm text-gray-600">셔틀 · {FORUM_TRANSIT.shuttle}</p>
          <p className="text-xs text-gray-500">{FORUM_TRANSIT.shuttleNote}</p>

          <h3 className="mt-5 text-sm font-semibold text-[#C8922A]">자가용</h3>
          <p className="mt-1 text-sm text-gray-800 leading-relaxed break-keep">{FORUM_CAR_ROUTE}</p>

          <div className="mt-5 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 space-y-1">
            <p><span className="font-semibold text-[#1B3A6B]">등록</span> · {FORUM_CHECKIN_TEXT}</p>
            <p>
              <span className="font-semibold text-[#1B3A6B]">문의</span> ·{' '}
              <a href={`mailto:${FORUM_CONTACT_EMAIL}`} className="underline break-all">{FORUM_CONTACT_EMAIL}</a>
            </p>
          </div>
        </section>

        <section id="video" className="scroll-mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1B3A6B] mb-4">포럼 홍보영상</h2>
          <VideoEmbed url={FORUM_PROMO_VIDEO_URL} title={`${FORUM_INFO.title} 홍보영상`} autoPlayLoop />
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

        <section id="missionfund" className="scroll-mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1B3A6B]">미션펀드로 후원하기</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed break-keep">
            2026 KIMA 포럼과 전국 이주민 사역을 미션펀드를 통해 후원하실 수 있습니다.
            아래 QR코드를 스캔하거나 버튼을 눌러 후원 페이지로 이동해 주세요.
          </p>
          <div className="mt-5 flex flex-col items-center gap-4">
            <Image
              src="/images/missionfund-qr.png"
              alt="미션펀드 2026 KIMA 포럼 후원 QR코드"
              width={200}
              height={200}
              className="w-40 h-40 rounded-lg border border-gray-200"
            />
            <a
              href={FORUM_MISSIONFUND_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#C8922A] text-white text-sm font-semibold hover:bg-[#b07f22] transition-colors"
            >
              미션펀드로 후원하기
            </a>
            <p className="text-xs text-gray-400 break-all">{FORUM_MISSIONFUND_URL}</p>
          </div>
        </section>

        <section id="survey" className="scroll-mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-[#1B3A6B]">포럼 피드백 설문</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed break-keep">
            포럼에 참석하신 분들의 의견을 듣습니다. 약 5분이 걸리며 이름 없이(무기명) 제출할 수 있습니다.
            보내 주신 의견은 내년 포럼을 준비하는 데 귀하게 쓰겠습니다.
          </p>
          {surveyState === 'open' ? (
            <Link
              href="/forum2026/survey"
              className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#1B3A6B] text-white text-sm font-semibold hover:bg-[#142d54] transition-colors"
            >
              설문 참여하기
            </Link>
          ) : (
            <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              {surveyState === 'before'
                ? `${FORUM_SURVEY_OPENS_TEXT}부터 참여하실 수 있습니다.`
                : '설문이 마감되었습니다. 참여해 주셔서 감사합니다.'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
