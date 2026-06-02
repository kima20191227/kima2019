import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '리스닝콜 & 포럼 | KIMA',
  description: '전국 이주민 사역자들이 함께 모이는 리스닝콜과 포럼을 소개합니다.',
}

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Network</p>
          <h1 className="text-3xl font-bold">리스닝콜 & 포럼</h1>
          <p className="mt-3 text-blue-200">
            전국 이주민 사역자들이 분기마다 모여 현장의 목소리를 나누는 시간
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* 소개 */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-4 text-gray-700 leading-relaxed">
          <h2 className="text-xl font-bold text-[#1B3A6B]">리스닝콜이란?</h2>
          <p>
            리스닝콜(Listening Call)은 KIMA가 분기마다 개최하는 전국 온오프라인 모임입니다.
            각 지역, 언어권, 사역대상의 담당 위원장들이 현장 상황을 공유하고,
            함께 기도하며 연대하는 핵심 프로그램입니다.
          </p>
          <p>
            온라인(Zoom)과 오프라인을 병행하며, 일반회원이면 누구나 신청하실 수 있습니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { icon: '🎙', title: '분기별 개최', desc: '1·4·7·10월 정기 개최' },
              { icon: '🌐', title: '온오프라인 병행', desc: 'Zoom + 현장 동시 진행' },
              { icon: '👥', title: '누구나 참여', desc: '일반회원 이상 신청 가능' },
            ].map((item) => (
              <div key={item.title} className="bg-[#F8F9FA] rounded-xl p-5 text-center">
                <span className="text-3xl">{item.icon}</span>
                <p className="font-semibold text-gray-800 mt-2">{item.title}</p>
                <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 포럼 소개 */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-4 text-gray-700 leading-relaxed">
          <h2 className="text-xl font-bold text-[#1B3A6B]">KIMA 포럼이란?</h2>
          <p>
            KIMA 포럼은 연 1~2회 개최되는 대규모 연합 집회입니다.
            이주민 사역 전문가 초청 강의, 지역별 사역 발표, 워크숍 등
            깊이 있는 배움과 교제의 시간으로 구성됩니다.
          </p>
        </section>

        {/* 링크 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/network/schedule"
            className="bg-[#1B3A6B] text-white rounded-xl p-6 flex items-center gap-4 hover:bg-[#142d54] transition-colors group"
          >
            <span className="text-3xl">📅</span>
            <div>
              <p className="font-bold">일정 & 참석 신청</p>
              <p className="text-sm text-blue-200 mt-0.5">예정된 리스닝콜·포럼 일정 확인</p>
            </div>
          </Link>
          <Link
            href="/network/archive"
            className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <span className="text-3xl">📂</span>
            <div>
              <p className="font-bold text-gray-900">지난 포럼 자료</p>
              <p className="text-sm text-gray-500 mt-0.5">발표 자료 및 녹화 영상 아카이브</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
