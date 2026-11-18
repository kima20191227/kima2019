import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ForumSurveyForm } from '@/components/forum2026/ForumSurveyForm'
import { FORUM_INFO } from '@/lib/forum2026'
import {
  FORUM_SURVEY_CLOSES_TEXT,
  FORUM_SURVEY_OPENS_TEXT,
  FORUM_SURVEY_TITLE,
  getForumSurveyState,
} from '@/lib/forumSurvey'

const DESCRIPTION = `${FORUM_INFO.title} 참석자 만족도·피드백 설문입니다. 내년 포럼을 준비하는 데 귀하게 쓰겠습니다.`

export const metadata: Metadata = {
  title: FORUM_SURVEY_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/forum2026/survey' },
  openGraph: {
    title: FORUM_SURVEY_TITLE,
    description: DESCRIPTION,
    url: '/forum2026/survey',
    siteName: 'KIMA',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/images/kima-logo.png', alt: 'KIMA 한국이주민선교연합회' }],
  },
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function Forum2026SurveyPage({ searchParams }: PageProps) {
  const state = getForumSurveyState()

  // 관리자·임원은 ?preview=1 로 오픈 전에도 화면을 확인할 수 있다 (제출은 막힘)
  const { preview } = await searchParams
  const session = preview === '1' ? await auth() : null
  const canPreview = session?.user?.role === 'ADMIN' || session?.user?.role === 'OFFICER'
  const showForm = state === 'open' || canPreview

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <section className="bg-[#1B3A6B] px-4 py-10 text-center text-white">
        <p className="text-[#C8922A] text-xs font-semibold tracking-widest uppercase mb-2">
          {FORUM_INFO.subtitle}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold">{FORUM_SURVEY_TITLE}</h1>
        <p className="mt-3 text-sm text-blue-200 break-keep">
          {FORUM_INFO.dateText} · {FORUM_INFO.venueName}
        </p>
      </section>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {showForm ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed break-keep mb-6">
                포럼에 함께해 주셔서 감사합니다. 약 5분이 걸리며, <strong>*</strong> 표시된 3개 문항만 필수입니다.
                이름·소속은 선택이라 <strong>무기명으로도 제출</strong>할 수 있습니다.
                {state === 'open' && <> 마감: {FORUM_SURVEY_CLOSES_TEXT}</>}
              </p>
              <ForumSurveyForm previewOnly={state !== 'open'} />
            </>
          ) : (
            <div className="rounded-xl bg-gray-50 p-6 text-center">
              <p className="font-semibold text-gray-800">
                {state === 'before' ? '설문이 아직 시작되지 않았습니다.' : '설문이 마감되었습니다.'}
              </p>
              <p className="mt-2 text-sm text-gray-500 break-keep">
                {state === 'before'
                  ? `${FORUM_SURVEY_OPENS_TEXT}부터 참여하실 수 있습니다.`
                  : '참여해 주셔서 감사합니다.'}
              </p>
              <Link
                href="/forum2026"
                className="mt-5 inline-block px-5 py-2.5 rounded-lg border border-[#1B3A6B] text-[#1B3A6B] text-sm font-semibold hover:bg-blue-50"
              >
                2026 포럼 안내로 돌아가기
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
