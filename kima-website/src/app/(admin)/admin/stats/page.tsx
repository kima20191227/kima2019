import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import nextDynamic from 'next/dynamic'
import type { Metadata } from 'next'

const StatsCharts = nextDynamic(
  () => import('@/components/admin/StatsCharts').then((m) => m.StatsCharts),
  { loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-xl" /> }
)

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '접속 통계 | KIMA 관리자' }

export default async function AdminStatsPage() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== 'ADMIN' && role !== 'OFFICER') redirect('/')

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7)
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30)

  // 요약 카드
  const [todayCount, yesterdayCount, weekCount, totalCount] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
    prisma.pageView.count({ where: { createdAt: { gte: yesterday, lt: today } } }).catch(() => 0),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }).catch(() => 0),
    prisma.pageView.count().catch(() => 0),
  ])

  // 일별 방문 (7일)
  type DayRow = { day: string; views: bigint }
  const dailyRaw = await prisma.$queryRaw<DayRow[]>`
    SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM-DD') AS day,
           COUNT(*)::bigint AS views
    FROM page_views
    WHERE created_at >= ${sevenDaysAgo}
    GROUP BY day
    ORDER BY day ASC
  `.catch(() => [] as DayRow[])

  // 인기 페이지 TOP 5 (30일)
  type PathRow = { path: string; views: bigint }
  const topPages = await prisma.$queryRaw<PathRow[]>`
    SELECT path, COUNT(*)::bigint AS views
    FROM page_views
    WHERE created_at >= ${thirtyDaysAgo}
    GROUP BY path
    ORDER BY views DESC
    LIMIT 5
  `.catch(() => [] as PathRow[])

  // 디바이스 비율 (30일)
  type DeviceRow = { device_type: string; views: bigint }
  const devices = await prisma.$queryRaw<DeviceRow[]>`
    SELECT COALESCE(device_type, 'desktop') AS device_type, COUNT(*)::bigint AS views
    FROM page_views
    WHERE created_at >= ${thirtyDaysAgo}
    GROUP BY device_type
  `.catch(() => [] as DeviceRow[])

  // 국가별 (30일)
  type CountryRow = { country: string; views: bigint }
  const countries = await prisma.$queryRaw<CountryRow[]>`
    SELECT COALESCE(country, '알 수 없음') AS country, COUNT(*)::bigint AS views
    FROM page_views
    WHERE created_at >= ${thirtyDaysAgo}
    GROUP BY country
    ORDER BY views DESC
    LIMIT 10
  `.catch(() => [] as CountryRow[])

  const serialize = <T extends Record<string, unknown>>(rows: T[]) =>
    rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
      )
    )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B3A6B]">접속 통계</h1>
        <p className="text-sm text-gray-500 mt-1">페이지 방문 현황을 확인합니다.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '오늘 방문', value: todayCount, color: 'text-[#1B3A6B]' },
          { label: '어제 방문', value: yesterdayCount, color: 'text-gray-600' },
          { label: '7일 방문', value: weekCount, color: 'text-[#2E7D32]' },
          { label: '누적 방문', value: totalCount, color: 'text-[#C8922A]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* 차트 */}
      <StatsCharts
        daily={serialize(dailyRaw) as { day: string; views: number }[]}
        topPages={serialize(topPages) as { path: string; views: number }[]}
        devices={serialize(devices) as { device_type: string; views: number }[]}
        countries={serialize(countries) as { country: string; views: number }[]}
      />
    </div>
  )
}
