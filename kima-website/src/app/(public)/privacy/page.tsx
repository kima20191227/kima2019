import type { Metadata } from 'next'

export const metadata: Metadata = { title: '개인정보처리방침 | KIMA' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">개인정보처리방침</h1>
          <p className="mt-2 text-blue-200 text-sm">최종 수정일: 2025년 1월 1일</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-8">

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제1조 (목적)</h2>
            <p>
              한국이주민선교연합회(이하 "KIMA")는 개인정보 보호법 제30조에 따라 정보주체의
              개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록
              하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제2조 (개인정보의 처리 목적)</h2>
            <p>KIMA는 다음 목적을 위하여 개인정보를 처리합니다.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>홈페이지 회원 가입 및 관리</li>
              <li>정회원 가입 신청 처리 및 자격 관리</li>
              <li>리스닝콜·포럼 참석 신청 및 안내</li>
              <li>이메일 뉴스레터 및 공지 발송</li>
              <li>단체 등록 신청 처리</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제3조 (개인정보의 처리 및 보유 기간)</h2>
            <p>
              KIMA는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를
              수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>회원 정보: 회원 탈퇴 시까지</li>
              <li>행사 참석 신청 정보: 행사 종료 후 1년</li>
              <li>이메일 수신 동의: 동의 철회 시까지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제4조 (처리하는 개인정보 항목)</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>필수:</strong> 이름, 이메일 주소</li>
              <li><strong>선택:</strong> 소속단체, 지역, 연락처</li>
              <li><strong>자동 수집:</strong> 접속 IP, 쿠키, 서비스 이용 기록</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제5조 (개인정보의 제3자 제공)</h2>
            <p>
              KIMA는 정보주체의 개인정보를 제2조에서 명시한 목적 범위 내에서만 처리하며,
              법령에 의하거나 정보주체의 동의 없이는 제3자에게 제공하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제6조 (정보주체의 권리·의무)</h2>
            <p>정보주체는 KIMA에 대해 언제든지 다음 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제7조 (개인정보 보호책임자)</h2>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p><strong>성명:</strong> 남양규</p>
              <p><strong>직책:</strong> 한국이주민선교연합회 상임대표</p>
              <p><strong>이메일:</strong> info@kima2019.org</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1B3A6B]">제8조 (쿠키의 운용)</h2>
            <p>
              KIMA는 로그인 세션 유지를 위해 쿠키를 사용합니다.
              브라우저 설정에서 쿠키를 거부할 경우 일부 서비스 이용이 제한될 수 있습니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
