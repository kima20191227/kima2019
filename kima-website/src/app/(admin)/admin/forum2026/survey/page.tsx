import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FORUM_SURVEY_KEY, FORUM_SURVEY_SECTIONS, FORUM_SURVEY_TITLE } from '@/lib/forumSurvey'
import { computeQuestionStat, type QuestionStat, type SurveyAnswers } from '@/lib/forumSurveyStats'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '2026 포럼 설문 결과 | KIMA 관리자' }

function pct(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100)
}

// 막대 + 숫자를 함께 표시 (색만으로 구분하지 않음)
function Bar({ label, count, total }: { label: string; count: number; total: number }) {
  const p = pct(count, total)
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 sm:w-56 shrink-0 text-gray-700 break-keep">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden" aria-hidden="true">
        <div className="h-full bg-[#1B3A6B]" style={{ width: `${p}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right tabular-nums text-gray-600">{count}명 ({p}%)</span>
    </div>
  )
}

function StatView({ stat }: { stat: QuestionStat }) {
  if (stat.count === 0) return <p className="text-sm text-gray-400">응답 없음</p>

  switch (stat.kind) {
    case 'rating':
      return (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-800">
            평균 <strong className="text-lg text-[#1B3A6B]">{stat.average}</strong> / 5점
            <span className="text-gray-500"> · 응답 {stat.count}명</span>
          </p>
          {stat.distribution.map((c, i) => (
            <Bar key={i} label={`${i + 1}점`} count={c} total={stat.count} />
          ))}
        </div>
      )
    case 'nps':
      return (
        <div className="space-y-1.5">
          <p className="text-sm text-gray-800">
            NPS <strong className="text-lg text-[#1B3A6B]">{stat.score}</strong>
            <span className="text-gray-500"> · 평균 {stat.average}점 · 응답 {stat.count}명</span>
          </p>
          <Bar label="추천 (9~10점)" count={stat.promoters} total={stat.count} />
          <Bar label="중립 (7~8점)" count={stat.passives} total={stat.count} />
          <Bar label="비추천 (0~6점)" count={stat.detractors} total={stat.count} />
        </div>
      )
    case 'choice':
      return (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500">응답 {stat.count}명{stat.question.type === 'multi' && ' (복수 선택)'}</p>
          {stat.items.map((it) => (
            <Bar key={it.option} label={it.option} count={it.count} total={stat.count} />
          ))}
          {stat.others.length > 0 && (
            <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-0.5">
              {stat.others.map((o, i) => (
                <li key={i} className="whitespace-pre-wrap break-words">기타: {o}</li>
              ))}
            </ul>
          )}
        </div>
      )
    case 'text':
      return (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">응답 {stat.count}건</p>
          <ul className="space-y-2">
            {stat.items.map((t, i) => (
              <li key={i} className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm text-gray-800 whitespace-pre-wrap break-words">
                {t}
              </li>
            ))}
          </ul>
        </div>
      )
  }
}

export default async function AdminForumSurveyPage() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'ADMIN' && role !== 'OFFICER') redirect('/')

  const rows = await prisma.forumSurveyResponse.findMany({
    where: { forumKey: FORUM_SURVEY_KEY },
    orderBy: { createdAt: 'desc' },
    select: { answers: true },
  })
  const answers = rows.map((r) => (r.answers ?? {}) as SurveyAnswers)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A6B]">{FORUM_SURVEY_TITLE} 결과</h1>
          <p className="text-sm text-gray-500 mt-1">총 {rows.length}명 응답</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/forum2026/survey?preview=1"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-[#1B3A6B] hover:bg-blue-50"
          >
            설문 화면 미리보기
          </Link>
          <a
            href="/api/admin/forum2026/survey/export"
            className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-semibold hover:bg-[#142d54]"
          >
            CSV 내려받기
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-white border border-gray-100 p-8 text-center text-gray-500">
          아직 접수된 응답이 없습니다.
        </p>
      ) : (
        FORUM_SURVEY_SECTIONS.map((section) => (
          <section key={section.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-6">
            <h2 className="text-base font-bold text-[#1B3A6B]">{section.title}</h2>
            {section.questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 break-keep">{q.label}</h3>
                <StatView stat={computeQuestionStat(q, answers)} />
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  )
}
