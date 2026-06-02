import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PremiumRequestForm } from '@/components/member/PremiumRequestForm'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '정회원 가입 안내 | KIMA' }

const CHECK = (
  <svg className="w-4 h-4 flex-shrink-0 text-[#C8922A]" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

export default async function UpgradePage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/member/upgrade')
  }

  const role = session.user.role
  const isPremium = role === 'PREMIUM' || role === 'OFFICER' || role === 'ADMIN'

  const dbUser = isPremium ? null : await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { premiumNote: true },
  })
  const premiumNote = dbUser?.premiumNote ?? null
  const hasPendingRequest = !!premiumNote?.startsWith('[신청]')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Premium</p>
          <h1 className="text-2xl font-bold">정회원 가입 안내</h1>
          <p className="mt-2 text-blue-200 text-sm">
            한국이주민선교연합회 정회원이 되어 이주민 선교 네트워크에 함께하세요.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isPremium ? (
          /* 이미 정회원인 경우 */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1B3A6B] mb-2">이미 정회원이십니다</h2>
            <p className="text-gray-500 mb-6">정회원 전용 자료실에 자유롭게 접근하실 수 있습니다.</p>
            <a href="/resources" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1B3A6B] text-white font-medium hover:bg-[#142d54] transition-colors">
              자료실 바로가기
            </a>
          </div>
        ) : (
          <div className="space-y-6">

            {/* 소개 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-gray-700 leading-relaxed text-sm space-y-2">
              <p>
                한국이주민선교연합회 정회원은 이주민 선교의 비전과 사역에 동참하며, 전국 각 지역의
                교회와 단체, 사역자들과 함께 네트워크를 이루는 회원입니다.
              </p>
              <p>
                정회원은 연합회의 주요 소식과 행사, 포럼, 세미나, 네트워크 소식을 우선적으로
                안내받고, 다양한 협력 사역에 참여할 수 있습니다.
              </p>
            </div>

            {/* 1. 회비 안내 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1B3A6B] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1B3A6B] text-white text-xs flex items-center justify-center font-bold">1</span>
                회비 안내
              </h2>
              <div className="bg-[#1B3A6B]/5 rounded-lg p-4 mb-3">
                <p className="text-xs text-gray-500 mb-0.5">정회원 연 회비</p>
                <p className="text-2xl font-bold text-[#1B3A6B]">50,000원 <span className="text-sm font-normal text-gray-400">/ 1년</span></p>
              </div>
              <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
                <p>회비는 정회원의 기본 가입 기준이며, 사역 참여와 네트워크 운영을 위한 소중한 재원으로 사용됩니다.</p>
                <p className="text-gray-400 text-xs">형편이 어려운 경우에는 무리하지 않도록 하되, 정회원 취지에 맞게 가능한 범위 안에서 참여해 주시면 됩니다.</p>
              </div>
            </div>

            {/* 2. 가입 방법 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1B3A6B] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1B3A6B] text-white text-xs flex items-center justify-center font-bold">2</span>
                가입 방법
              </h2>
              <ol className="space-y-3 text-sm text-gray-700">
                {[
                  '홈페이지 또는 사무국을 통해 정회원 가입 의사를 신청합니다.',
                  '가입 신청 후 회비를 납부합니다.',
                  '입금 확인 후 정회원으로 등록됩니다.',
                  '등록 완료 후 각종 안내와 소식을 받아보실 수 있습니다.',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C8922A] text-white text-xs flex items-center justify-center font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 3. 납부 안내 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1B3A6B] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1B3A6B] text-white text-xs flex items-center justify-center font-bold">3</span>
                납부 안내
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-[#1B3A6B] rounded-xl text-white">
                  <div>
                    <p className="text-xs text-blue-200 mb-0.5">납부 계좌 · 하나은행</p>
                    <p className="text-lg font-bold tracking-wide">435-910079-52904</p>
                    <p className="text-xs text-blue-200 mt-0.5">예금주: 한국이주민선교연합회</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>입금자명은 <strong className="text-gray-800">"이름 + 정회원"</strong> 형식으로 적어 주시면 확인이 쉽습니다.</p>
                  <p className="text-gray-400 text-xs">단체 또는 공동대표, 임원은 필요에 따라 별도 후원도 가능합니다.</p>
                </div>
              </div>
            </div>

            {/* 4. 정회원 혜택 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-amber-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#C8922A] text-white text-xs flex items-center justify-center font-bold">4</span>
                정회원 혜택
              </h2>
              <ul className="space-y-2.5 text-sm text-amber-800">
                {[
                  '연합회의 주요 행사 및 포럼 우선 안내',
                  '지역별, 언어권별, 대상별 사역 네트워크 정보 제공',
                  '법률, 의료, 노무 등 전문 자문 네트워크 연결 기회',
                  '정회원 중심의 사역 협력 및 교류 참여',
                  '연합회가 진행하는 주요 프로젝트와 공동 사역 참여 기회',
                  '필요 시 연합회 명의의 격려 및 연대 혜택',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    {CHECK}
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 5. 정회원의 의미 */}
            <div className="bg-[#1B3A6B] rounded-xl p-6 text-white">
              <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs flex items-center justify-center font-bold">5</span>
                정회원의 의미
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                정회원은 단순한 회비 납부자가 아니라, 한국 이주민 선교를 함께 세워 가는
                <strong className="text-white"> 동역자</strong>입니다. 정회원의 참여는 연합회의 사역을
                넓히고, 지역과 언어권과 사역 분야를 연결하는 데 중요한 역할을 합니다.
              </p>
            </div>

            {/* 6. 입금 확인 신청 */}
            <PremiumRequestForm hasPendingRequest={hasPendingRequest} pendingNote={premiumNote} />

            {/* 사무국 연락 */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-[#1B3A6B] mb-4">사무국 문의</h2>
              <a
                href="mailto:kima20191227@gmail.com"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">이메일</p>
                  <p className="font-medium text-gray-700 group-hover:text-[#1B3A6B]">kima20191227@gmail.com</p>
                </div>
              </a>
            </div>

            <p className="text-xs text-gray-400 text-center pb-4">
              기부금 영수증은 비영리단체 등록 완료 후 발급 예정입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
