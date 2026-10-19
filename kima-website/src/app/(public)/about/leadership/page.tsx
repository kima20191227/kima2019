import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '임원단 소개 | KIMA' }

const GROUP_ORDER = ['ADVISOR', 'EXECUTIVE', 'LANGUAGE_CHAIR', 'REGION_CHAIR', 'DENOMINATION_REP', 'NETWORK_CHAIR'] as const

const GROUP_LABELS: Record<string, string> = {
  ADVISOR:          '고문 · 자문위원',
  EXECUTIVE:        '운영위원회',
  LANGUAGE_CHAIR:   '언어권 위원장',
  REGION_CHAIR:     '지역 위원장',
  DENOMINATION_REP: '교단 대표',
  NETWORK_CHAIR:    '네트워크 위원장',
}

type Leader = {
  id: string
  group: string
  title: string
  name: string
  org: string | null
  position: string | null
  phone: string | null
  email: string | null
  nations: string | null
  mission: string | null
  order: number
}

function MemberCard({ title, name, org, position, phone, email, nations, mission }: Leader) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
        {name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#C8922A] font-semibold">{title}</p>
        <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
          <p className="text-base font-bold text-gray-900">{name}</p>
          {position && <span className="text-xs text-gray-400 font-medium">{position}</span>}
        </div>
        {org && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{org}</p>}

        {(nations || mission || phone || email) && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 space-y-1">
            {nations && (
              <div className="flex items-start gap-1.5">
                <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 w-14">대상국가</span>
                <span className="text-xs text-gray-600 leading-snug">{nations}</span>
              </div>
            )}
            {mission && (
              <div className="flex items-start gap-1.5">
                <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 w-14">사역구분</span>
                <span className="text-xs text-gray-600 leading-snug">{mission}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-start gap-1.5">
                <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 w-14">연락처</span>
                <a href={`tel:${phone}`} className="text-xs text-[#1B3A6B] hover:underline leading-snug">
                  {phone}
                </a>
              </div>
            )}
            {email && (
              <div className="flex items-start gap-1.5">
                <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 w-14">이메일</span>
                <a href={`mailto:${email}`} className="text-xs text-[#1B3A6B] hover:underline break-all leading-snug">
                  {email}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default async function LeadershipPage() {
  const allLeaders = await prisma.leader.findMany({
    where: { isActive: true },
    orderBy: [{ group: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
  }).catch(() => [])

  const grouped = GROUP_ORDER.reduce<Record<string, Leader[]>>((acc, g) => {
    acc[g] = allLeaders.filter((l) => l.group === g)
    return acc
  }, {} as Record<string, Leader[]>)

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Leadership</p>
          <h1 className="text-3xl font-bold">임원단 소개</h1>
          <p className="mt-3 text-blue-200">KIMA 4기 임원단 · {today} 현재</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {allLeaders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-3xl mb-3">👥</p>
            <p>임원단 정보를 준비 중입니다.</p>
          </div>
        ) : (
          GROUP_ORDER.map((g) =>
            grouped[g].length > 0 ? (
              <section key={g} className="mb-12">
                <h2 className="text-lg font-bold text-[#1B3A6B] border-b-2 border-[#C8922A] pb-2 mb-5 inline-block">
                  {GROUP_LABELS[g]}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[g].map((m) => (
                    <MemberCard key={m.id} {...m} />
                  ))}
                </div>
              </section>
            ) : null
          )
        )}

        <p className="text-center text-sm text-gray-400 mt-4">
          문의: info@kima2019.org
        </p>
      </div>
    </div>
  )
}
