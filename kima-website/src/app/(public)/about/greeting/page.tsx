import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '상임대표 인사말 | KIMA',
  description: '한국이주민선교연합회 상임대표 남양규 목사의 인사말입니다.',
}

export default function GreetingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Greeting</p>
          <h1 className="text-2xl font-bold">상임대표 인사말</h1>
          <p className="mt-2 text-blue-200 text-sm">한국이주민선교연합회 상임대표 남양규 목사</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">

        {/* 인사말 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* 프로필 사진 */}
            <div className="shrink-0 w-36 h-44 rounded-xl overflow-hidden border border-gray-200">
              <Image
                src="/images/nam-yang-gyu.webp"
                alt="남양규 상임대표"
                width={144}
                height={176}
                className="w-full h-full object-cover object-top"
                priority
              />
            </div>
            <div className="flex-1">
              <p className="text-[#C8922A] text-sm font-semibold mb-1">상임대표</p>
              <h2 className="text-2xl font-bold text-[#1B3A6B] mb-0.5">남양규 목사</h2>
              <p className="text-sm text-gray-500 mb-0.5">한국이주민선교연합회 (KIMA)</p>
              <p className="text-xs text-gray-400 mb-1">사역 단체 — 서울네이션즈교회 담임목사 (예장합동)</p>
              <p className="text-xs text-gray-400 mb-6">
                <a href="mailto:namnamadfc@hanmail.net" className="hover:text-[#1B3A6B] transition-colors">
                  namnamadfc@hanmail.net
                </a>
              </p>
              <div className="space-y-4 text-gray-700 leading-relaxed text-[15px]">
                <p>
                  한국이주민선교연합회(KIMA) 홈페이지를 방문해 주신 모든 분들을 주님의 이름으로
                  환영합니다.
                </p>
                <p>
                  오늘 한국에는 280만 명이 넘는 이주민들이 살아가고 있습니다.
                  이주노동자, 유학생, 결혼이민자, 다문화가정 자녀, 난민과 미등록 이주민까지—
                  이들은 우리 곁에서 함께 삶을 나누고 있는 이웃입니다.
                </p>
                <p>
                  KIMA는 이 이웃들을 섬기는 전국의 교회와 선교단체, 복지기관들이 하나로
                  연결되어 함께 하나님의 선교를 이루어 가는 연합 플랫폼입니다.
                  연결하고, 기록하고, 보이게 하고, 후원으로 이어주는 사명을 가지고
                  이주민 사역 현장을 섬기겠습니다.
                </p>
                <p>
                  여러분의 관심과 참여, 그리고 기도가 이 사역의 든든한 기반이 됩니다.
                  함께해 주십시오.
                </p>
              </div>
              <p className="mt-8 text-right text-gray-500 text-sm">
                한국이주민선교연합회 상임대표<br />
                <span className="text-[#1B3A6B] font-bold text-base">남양규 목사</span>
              </p>
            </div>
          </div>
        </div>

        {/* 학력 & 약력 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h3 className="text-lg font-bold text-[#1B3A6B] mb-6">학력 및 약력</h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-[#C8922A] uppercase tracking-wider mb-3">학력</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2"><span className="text-gray-300">•</span>충남대학교 전자교육공학과 졸업</li>
                <li className="flex gap-2"><span className="text-gray-300">•</span>충신대학교 신학대학원 졸업</li>
                <li className="flex gap-2"><span className="text-gray-300">•</span>영국 London Theological Seminary 졸업</li>
                <li className="flex gap-2"><span className="text-gray-300">•</span>아세아연합신학대학원 졸업 (Th.M)</li>
                <li className="flex gap-2"><span className="text-gray-300">•</span>아신대학교 신학박사 (Th.D 재학 중)</li>
              </ul>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h4 className="text-sm font-semibold text-[#C8922A] uppercase tracking-wider mb-3">사역 및 경력</h4>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <li className="flex gap-3">
                  <span className="shrink-0 text-gray-300 mt-0.5">•</span>
                  <span>1985년부터 3년간 중학교 교사로 근무, 1988년부터 CCC 전임간사로 사역 시작</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-gray-300 mt-0.5">•</span>
                  <span>1992년 제자들선교회(DFC) 첫 선교사로 필리핀 바기오(Baguio) 파송, 3년간 타문화선교훈련원장(DTI) 역임</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-gray-300 mt-0.5">•</span>
                  <span>2001~2009년 제자들선교회 총무·대표로 캠퍼스 사역과 해외 선교 사역 섬김</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-gray-300 mt-0.5">•</span>
                  <span>인천 계산장로교회 선교목사로 국내 이주노동자 사역 감당</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-gray-300 mt-0.5">•</span>
                  <span>2010년 1월 다국적 성도로 구성된 서울네이션즈교회(합동) 용산 개척, 현재까지 담임</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-gray-300 mt-0.5">•</span>
                  <span>2013년 이후 한국선교회(GFM) 대표, 현지인 신학교수 양성·목회자 파송·외국인 신학생 장학 사역</span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 text-gray-300 mt-0.5">•</span>
                  <span>합동측 이주민선교연합 상임대표, KIMA 서기·공동대표 역임</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
