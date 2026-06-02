import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '이주민 현황 데이터 | KIMA',
  description: '한국 내 이주민 인구 통계 및 사역 현황 데이터',
}

// 법무부·통계청 기준 기초 데이터 (업데이트 필요)
const STATS = [
  {
    category: '체류 외국인 현황 (2023년 말 기준, 법무부)',
    items: [
      { label: '총 체류 외국인', value: '2,507,584명' },
      { label: '장기체류 (90일 초과)', value: '1,781,203명' },
      { label: '단기체류', value: '726,381명' },
      { label: '등록 외국인', value: '1,228,337명' },
    ],
  },
  {
    category: '국적별 현황 (상위 5개국)',
    items: [
      { label: '중국', value: '777,408명 (31.0%)' },
      { label: '베트남', value: '243,779명 (9.7%)' },
      { label: '태국', value: '199,606명 (8.0%)' },
      { label: '미국', value: '156,962명 (6.3%)' },
      { label: '우즈베키스탄', value: '87,473명 (3.5%)' },
    ],
  },
  {
    category: '체류 자격별 현황',
    items: [
      { label: '결혼이민(F-6)', value: '167,183명' },
      { label: '재외동포(F-4)', value: '514,842명' },
      { label: '방문취업(H-2)', value: '168,413명' },
      { label: '비전문취업(E-9)', value: '295,601명' },
      { label: '유학생(D-2)', value: '166,891명' },
    ],
  },
]

const WHITEPAPER_LIST = [
  { title: 'KIMA 이주민 사역 백서 1호 (2022)', year: '2022', size: 'PDF 4.2MB' },
  { title: '이주민 사역 현장 조사 보고서 (2023)', year: '2023', size: 'PDF 2.8MB' },
]

export default function DataPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Data</p>
          <h1 className="text-3xl font-bold">이주민 현황 데이터</h1>
          <p className="mt-3 text-blue-200">한국 내 이주민 통계와 사역 현황을 기록합니다</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* 핵심 수치 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-5">핵심 수치</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '총 체류 외국인', value: '250만+', sub: '2023년 말 기준' },
              { label: '이주노동자', value: '46만+', sub: 'E-9·H-2 합산' },
              { label: '결혼이민자', value: '16만+', sub: 'F-6 기준' },
              { label: '유학생', value: '17만+', sub: 'D-2 기준' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
                <p className="text-2xl md:text-3xl font-bold text-[#C8922A]">{s.value}</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 상세 통계 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-5">상세 통계</h2>
          <div className="space-y-6">
            {STATS.map((group) => (
              <div key={group.category} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">{group.category}</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-6 py-3">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-semibold text-[#1B3A6B]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            출처: 법무부 출입국·외국인정책 통계월보 (2023.12 기준). 수치는 정기 업데이트 예정입니다.
          </p>
        </section>

        {/* 백서 다운로드 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-5">백서 & 보고서 다운로드</h2>
          <div className="space-y-3">
            {WHITEPAPER_LIST.map((doc) => (
              <div key={doc.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
                    PDF
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.year} · {doc.size}</p>
                  </div>
                </div>
                <button className="flex-shrink-0 text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  문의하기
                </button>
              </div>
            ))}
            <p className="text-xs text-gray-400">
              백서 파일은 kima20191227@gmail.com로 요청하시면 제공해 드립니다.
            </p>
          </div>
        </section>

        {/* 이주민 관련 뉴스 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-5">이주민 관련 뉴스</h2>
          <Link
            href="/network/news"
            className="group block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#C8922A]/40 transition-all overflow-hidden"
          >
            <div className="flex items-stretch">
              {/* 좌측 강조 바 */}
              <div className="w-1.5 bg-[#C8922A] flex-shrink-0" />

              <div className="flex-1 p-6 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1B3A6B]/10 text-[#1B3A6B]">
                      AI 자동 수집
                    </span>
                    <span className="text-xs text-gray-400">매일 오전 8시 업데이트</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#1B3A6B] transition-colors">
                    이주민 관련 뉴스 바로가기
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    법령·통계·다문화가족·이주노동자·유학생 관련 최신 뉴스를 AI가 수집·요약합니다.
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-[#C8922A] transition-colors flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </section>

      </div>
    </div>
  )
}
