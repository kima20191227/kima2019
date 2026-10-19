import type { Metadata } from 'next'

export const metadata: Metadata = { title: '이용약관 | KIMA' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">이용약관</h1>
          <p className="mt-2 text-blue-200 text-sm">최종 수정일: 2026년 5월 16일</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제1조 (목적)</h2>
            <p>
              본 약관은 한국이주민선교연합회(이하 "KIMA")가 운영하는 kima2019.org(이하 "서비스")의
              이용 조건 및 절차, 이용자와 KIMA의 권리·의무 및 책임사항에 관한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제2조 (회원가입)</h2>
            <p>
              이용자는 KIMA가 정한 양식에 따라 회원정보를 기입하고 본 약관에 동의함으로써
              회원가입을 신청합니다. KIMA는 허위 정보를 기재한 가입 신청은 거절할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제3조 (정회원)</h2>
            <p>
              정회원 자격은 연 5만원 회비 납부 및 사무국 확인 후 부여됩니다.
              정회원 자격은 납부일로부터 1년간 유효하며, 갱신하지 않을 경우 일반회원으로 자동 전환됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제4조 (서비스 이용)</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>회원은 서비스를 선교·사역 목적에 맞게 이용해야 합니다.</li>
              <li>타인의 개인정보를 침해하거나 명예를 훼손하는 행위는 금지됩니다.</li>
              <li>상업적 광고, 스팸 등의 목적으로 서비스를 이용할 수 없습니다.</li>
              <li>서비스 내 콘텐츠를 무단으로 복제·배포할 수 없습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제5조 (서비스 중단)</h2>
            <p>
              KIMA는 시스템 점검, 서버 장애, 천재지변 등의 사유로 서비스 제공을 일시적으로
              중단할 수 있으며, 이에 대해 회원에게 미리 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제6조 (회원 탈퇴)</h2>
            <p>
              회원은 언제든지 info@kima2019.org에 탈퇴를 요청할 수 있으며,
              KIMA는 즉시 처리합니다. 단, 게시한 콘텐츠는 별도 요청이 없는 한 유지될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제7조 (면책조항)</h2>
            <p>
              KIMA는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 인한
              서비스 장애에 대해 책임을 지지 않습니다. 회원 간 분쟁에 대해서도 KIMA는 관여하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제8조 (준거법)</h2>
            <p>본 약관은 대한민국 법률에 따라 규율되며, 분쟁 발생 시 서울중앙지방법원을 관할법원으로 합니다.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
