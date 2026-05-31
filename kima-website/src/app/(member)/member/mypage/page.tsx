import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PasswordChangeForm } from '@/components/member/PasswordChangeForm'
import { ProfileEditForm } from '@/components/member/ProfileEditForm'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '마이페이지 | KIMA' }

const ROLE_LABELS: Record<UserRole, string> = {
  MEMBER: '일반회원',
  PREMIUM: '정회원',
  OFFICER: '임원',
  ADMIN: '관리자',
}
const ROLE_COLORS: Record<UserRole, string> = {
  MEMBER: 'bg-gray-100 text-gray-600',
  PREMIUM: 'bg-amber-100 text-amber-700',
  OFFICER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
}

export default async function MypagePage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login?callbackUrl=/member/mypage')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: { select: { provider: true } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, type: true, createdAt: true, category: { select: { name: true } } },
      },
    },
  })

  if (!user) redirect('/auth/login')

  const isPremiumExpired = user.role === 'PREMIUM' && user.expiresAt && user.expiresAt < new Date()
  const daysUntilExpiry = user.expiresAt
    ? Math.ceil((user.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A6B]">마이페이지</h1>
          <p className="text-sm text-gray-500 mt-1">내 정보와 활동을 확인합니다.</p>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {(user.name ?? user.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{user.name ?? '(이름 없음)'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
              {user.organization && (
                <p className="text-gray-400 text-xs mt-1">🏢 {user.organization}</p>
              )}
              {user.phone && (
                <p className="text-gray-400 text-xs">☎ {user.phone}</p>
              )}
              {user.region && (
                <p className="text-gray-400 text-xs">📍 {user.region}</p>
              )}
            </div>
          </div>

          {/* 정회원 상태 */}
          {user.role === 'PREMIUM' && (
            <div className={`mt-5 p-4 rounded-lg ${isPremiumExpired ? 'bg-red-50 border border-red-200' : daysUntilExpiry && daysUntilExpiry <= 30 ? 'bg-orange-50 border border-orange-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-2 text-sm">
                <span>{isPremiumExpired ? '❌' : '✅'}</span>
                <span className="font-medium">
                  {isPremiumExpired
                    ? '정회원 자격이 만료되었습니다.'
                    : `정회원 유효 기간: ${user.expiresAt?.toLocaleDateString('ko-KR')}까지`}
                </span>
              </div>
              {!isPremiumExpired && daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                <p className="text-xs text-orange-600 mt-1">
                  {daysUntilExpiry}일 후 만료됩니다. 갱신을 준비해 주세요.
                </p>
              )}
              {(isPremiumExpired || (daysUntilExpiry !== null && daysUntilExpiry <= 30)) && (
                <Link href="/member/upgrade" className="inline-block mt-2 text-xs text-[#1B3A6B] font-medium hover:underline">
                  정회원 갱신 안내 →
                </Link>
              )}
            </div>
          )}

          {/* 일반회원 → 정회원 유도 */}
          {user.role === 'MEMBER' && (
            <div className="mt-5 p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-700">
                정회원(연 5만원)이 되시면 자료실 전문 자료와 추가 기능을 이용할 수 있습니다.
              </p>
              <Link href="/member/upgrade" className="inline-block mt-2 text-xs text-[#1B3A6B] font-medium hover:underline">
                정회원 신청 안내 →
              </Link>
            </div>
          )}
        </div>

        <ProfileEditForm
          user={{
            email: user.email,
            name: user.name,
            position: user.position,
            phone: user.phone,
            denomination: user.denomination,
            organization: user.organization,
            address: user.address,
            region: user.region,
            ministryLanguages: user.ministryLanguages,
            ministryTargets: user.ministryTargets,
          }}
        />

        {/* 연동 계정 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
          <h3 className="font-semibold text-gray-800 mb-4">연동 계정</h3>
          <div className="space-y-2">
            {user.accounts.length === 0 ? (
              <p className="text-sm text-gray-400">연동된 계정이 없습니다.</p>
            ) : (
              user.accounts.map((account) => {
                const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
                  credentials: { label: '이메일/비밀번호', color: 'bg-gray-100 text-gray-700' },
                  google: { label: 'Google', color: 'bg-red-100 text-red-700' },
                  kakao: { label: 'Kakao', color: 'bg-yellow-100 text-yellow-800' },
                  naver: { label: 'Naver', color: 'bg-green-100 text-green-700' },
                }
                const info = PROVIDER_LABELS[account.provider] ?? { label: account.provider, color: 'bg-gray-100 text-gray-700' }
                return (
                  <div key={account.provider} className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${info.color}`}>
                      {info.label}
                    </span>
                    <span className="text-xs text-gray-400">연동됨</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 비밀번호 변경 — 이메일/비밀번호 로그인 계정만 표시 */}
        {user.accounts.some((a) => a.provider === 'credentials') && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
            <h3 className="font-semibold text-gray-800 mb-4">보안 설정</h3>
            <PasswordChangeForm />
          </div>
        )}

        {/* 최근 활동 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
          <h3 className="font-semibold text-gray-800 mb-4">최근 작성 게시글</h3>
          {user.posts.length === 0 ? (
            <p className="text-sm text-gray-400">작성한 게시글이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {user.posts.map((post) => (
                <div key={post.id} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${post.type === 'NOTICE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {post.type === 'NOTICE' ? '공지' : '나눔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {post.category?.name} · {post.createdAt.toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 가입 정보 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-7">
          <h3 className="font-semibold text-gray-800 mb-4">가입 정보</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>가입일</span>
              <span className="font-medium">{user.createdAt.toLocaleDateString('ko-KR')}</span>
            </div>
            {user.approvedAt && (
              <div className="flex justify-between">
                <span>정회원 승인일</span>
                <span className="font-medium">{user.approvedAt.toLocaleDateString('ko-KR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
