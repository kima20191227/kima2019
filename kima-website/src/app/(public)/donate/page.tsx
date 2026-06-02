import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '후원하기 | KIMA',
  description: '한국이주민선교연합회 후원 계좌 및 방법 안내',
}

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-3">Donate</p>
          <h1 className="text-3xl font-bold">후원으로 함께해 주세요</h1>
          <p className="mt-4 text-blue-200 leading-relaxed">
            여러분의 후원이 전국 이주민 사역자들의 손을 붙잡고,<br />
            한국 땅의 이주민들에게 복음과 사랑을 전합니다.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        {/* 계좌 정보 */}
        <div className="bg-[#1B3A6B] rounded-2xl p-8 text-white text-center shadow-lg">
          <p className="text-blue-200 text-sm mb-2">후원 계좌</p>
          <p className="text-xl font-semibold mb-1">하나은행</p>
          <p className="text-3xl font-bold tracking-wider text-[#C8922A] my-3">435-910079-52904</p>
          <p className="text-blue-200">예금주: 한국이주민선교연합회</p>
        </div>

        {/* 후원 방법 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
          <h2 className="font-bold text-[#1B3A6B] text-lg mb-5">후원 방법</h2>
          <ol className="space-y-4">
            {[
              '위 계좌로 후원금을 입금합니다.',
              '입금 후 성함, 금액, 용도(일반후원 / 특정사역)를 아래로 알려주세요.',
              '영수증 발급 요청은 별도 문의 바랍니다.',
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1B3A6B] text-white text-sm flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <p className="text-gray-700 pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* 입금 후 연락 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
          <h2 className="font-bold text-[#1B3A6B] text-lg mb-5">입금 후 연락</h2>
          <div className="space-y-3">
            <a
              href="mailto:kima20191227@gmail.com"
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1B3A6B] flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400">이메일</p>
                <p className="font-semibold text-gray-800 group-hover:text-[#1B3A6B]">kima20191227@gmail.com</p>
              </div>
            </a>

          </div>
        </div>

        {/* 기부금 영수증 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex gap-3 items-start">
            <span className="text-2xl flex-shrink-0">📋</span>
            <div>
              <p className="font-semibold text-amber-800">기부금 영수증 안내</p>
              <p className="text-sm text-amber-700 mt-1">
                비영리단체 등록 완료 후 기부금 영수증 발급이 가능합니다.
                현재 법인화 절차가 진행 중이며, 완료 후 별도 안내드리겠습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
