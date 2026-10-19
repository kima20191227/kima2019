import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'CI 가이드 | KIMA' }

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Brand</p>
          <h1 className="text-3xl font-bold">CI 가이드</h1>
          <p className="mt-3 text-blue-200">KIMA 브랜드 자산 — 로고·색상·폰트</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* 로고 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-6">로고</h2>
          <div className="flex">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center gap-3">
              <Image
                src="/images/kima-logo.png"
                alt="KIMA 로고"
                width={180}
                height={80}
                className="object-contain"
              />
              <p className="text-xs text-gray-400">라이트 배경용</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            ※ 공식 로고 파일(PNG)은 사무국(info@kima2019.org)으로 요청해 주세요.
          </p>
        </section>

        {/* 색상 팔레트 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-6">색상 팔레트</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Primary Navy', hex: '#1B3A6B', textColor: 'text-white' },
              { name: 'Accent Gold', hex: '#C8922A', textColor: 'text-white' },
              { name: 'Background', hex: '#F8F9FA', textColor: 'text-gray-700' },
              { name: 'Text Dark', hex: '#1A1A1A', textColor: 'text-white' },
            ].map((color) => (
              <div key={color.name}>
                <div
                  className={`rounded-xl h-24 shadow-sm flex items-end p-3 ${color.textColor}`}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="text-xs font-mono">{color.hex}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium">{color.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 타이포그래피 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-6">타이포그래피</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 space-y-5">
            <div>
              <p className="text-xs text-gray-400 mb-2">한국어 — Noto Sans KR</p>
              <p className="text-2xl font-bold text-[#1B3A6B]">한국이주민선교연합회</p>
              <p className="text-base text-gray-700 mt-1">연결하고 · 기록하고 · 보이게 하고 · 후원으로 이어주는</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">영어 — Inter</p>
              <p className="text-2xl font-bold text-[#1B3A6B] font-sans">Korea Immigrants Missions Association</p>
              <p className="text-base text-gray-700 mt-1 font-sans">Connect · Record · Show · Fund</p>
            </div>
          </div>
        </section>

        {/* 사용 지침 */}
        <section>
          <h2 className="text-xl font-bold text-[#1B3A6B] mb-6">사용 지침</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7 space-y-3 text-sm text-gray-700">
            <p>✅ 로고는 원본 파일을 사용하고, 임의로 변형하지 않습니다.</p>
            <p>✅ Primary Navy와 Accent Gold를 주요 색상으로 사용합니다.</p>
            <p>✅ 배경색에 따라 라이트/다크 버전 로고를 적절히 선택합니다.</p>
            <p>❌ 로고 색상을 임의로 변경하지 않습니다.</p>
            <p>❌ 로고에 그림자·테두리·왜곡 효과를 적용하지 않습니다.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
