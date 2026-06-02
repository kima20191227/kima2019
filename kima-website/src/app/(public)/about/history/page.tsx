import type { Metadata } from 'next'

export const metadata: Metadata = { title: '설립 배경 & 연혁 | KIMA' }

const TIMELINE = [
  {
    period: '1기 창립 (2019–2021)',
    color: 'border-[#1B3A6B]',
    bg: 'bg-blue-50',
    dot: 'bg-[#1B3A6B]',
    events: [
      { date: '2019.12.27', text: '한국이주민선교연합회(KIMA) 창립총회 — 오륜교회 그레이스홀' },
      { date: '2020', text: 'COVID-19 대응 — 온라인 리스닝콜 전환, 이주민 긴급 지원 정보 공유' },
      { date: '2021.09.13', text: '임시총회 — 안양새중앙교회' },
      { date: '2021.10.15', text: '제1차 정관개정위원회 개최' },
    ],
  },
  {
    period: '2기 (2022–2023)',
    color: 'border-[#C8922A]',
    bg: 'bg-amber-50',
    dot: 'bg-[#C8922A]',
    events: [
      { date: '2022.01.20', text: '제2기 정기총회 — 새중앙교회' },
      { date: '2022', text: '언어권별·지역별 위원장 체계 정비 및 사역 네트워크 확장' },
      { date: '2023', text: '리스닝콜 정례화 — 전국 사역자 연합 소통 채널 운영' },
    ],
  },
  {
    period: '3기 (2024–2025)',
    color: 'border-purple-500',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500',
    events: [
      { date: '2024.03.19', text: '제3기 정기총회' },
      { date: '2024', text: '회원 디렉토리 구축 및 전국 단체 네트워크 가시화 추진' },
      { date: '2025.03.19', text: '정기총회 (3기 연차)' },
      { date: '2025', text: 'KIMA 홈페이지(kima2019.org) 리뉴얼 및 플랫폼 고도화' },
    ],
  },
  {
    period: '4기 (2026–현재)',
    color: 'border-green-500',
    bg: 'bg-green-50',
    dot: 'bg-green-500',
    events: [
      { date: '2026.02.26', text: '말레이시아 BEM(Borneo Evangelical Mission)과 MOU 체결' },
      { date: '2026.03.19', text: '제4기 정기총회 출범' },
      { date: '2026', text: '400만 이주민 시대를 향한 디지털 전환 및 세계선교 연대 강화' },
    ],
  },
]

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">History</p>
          <h1 className="text-3xl font-bold">설립 배경 & 연혁</h1>
          <p className="mt-3 text-blue-200">한국이주민선교연합회 창립(2019)부터 4기까지의 발자취</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* 설립 배경 */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-4">설립 배경</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 text-gray-700 leading-relaxed space-y-4">
            <p>
              한국 내 이주민 인구가 200만 명을 넘어서면서 교회와 NGO 현장에서는 각자도생의 한계를
              절감하기 시작했습니다. 중복 지원, 정보 단절, 재정 불균형 등 연합 없이는 해결할 수 없는
              구조적 문제들이 드러났습니다.
            </p>
            <p>
              이에 전국 각지에서 이주민 사역을 감당하던 목회자·사역자들이 모여,
              <strong> "흩어져 있으면 약하고, 함께하면 강하다"</strong>는 신념으로
              2019년 12월 27일 한국이주민선교연합회(KIMA)를 창립하였습니다.
              이 날짜는 도메인(kima2019.org)과 사무국 이메일(kima20191227@gmail.com)에도
              새겨져 있습니다.
            </p>
            <p>
              KIMA는 하나님의 명령(창 1:26; 마 28:18-20)을 준행하여 이 땅에 보내신 이주민들을
              각양의 은사(엡 4:11-16)를 통해 그리스도의 모범(빌 2:1-11)을 따라 섬기는
              연합 기관입니다.
            </p>
          </div>
        </section>

        {/* 연혁 타임라인 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-8">연혁</h2>
          <div className="space-y-10">
            {TIMELINE.map((phase) => (
              <div key={phase.period}>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 ${phase.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${phase.dot}`} />
                  {phase.period}
                </div>
                <div className={`border-l-4 ${phase.color} pl-6 space-y-5`}>
                  {phase.events.map((e, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="flex-shrink-0 text-xs font-bold text-gray-400 w-20 pt-0.5">{e.date}</span>
                      <p className="text-gray-700 leading-snug">{e.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
