import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { LazyPopupBanner } from '@/components/home/LazyPopupBanner'
import { CounterSection } from '@/components/home/CounterSection'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const revalidate = 3600

function getStoryThumb(story: {
  thumbnail?: string | null
  images: string[]
  videoUrls: string[]
}): string | null {
  if (story.thumbnail) return story.thumbnail
  if (story.videoUrls.length > 0) {
    const ytMatch = story.videoUrls[0].match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
  }
  return story.images[0] ?? null
}

export default async function HomePage() {
  const [
    session,
    notices, newsStories, eventPromos,
    eventMedia,
    dbEvents, orgCount, memberCount, resourceCount,
    ministryResources,
    recentNews,
  ] = await Promise.all([
    auth().catch(() => null),
    // 3단 게시판
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'NOTICE'      }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, createdAt: true } }).catch(() => []),
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'NEWS'        }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, createdAt: true, source: true } }).catch(() => []),
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'EVENT_PROMO' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, createdAt: true } }).catch(() => []),
    // 사진 갤러리
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'EVENT_MEDIA' }, orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, title: true, thumbnail: true, images: true, videoUrls: true } }).catch(() => []),
    // 일정·통계
    prisma.event.findMany({ where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' }, take: 4 }).catch(() => []),
    prisma.organization.count({ where: { isPublic: true } }).catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.resource.count().catch(() => 0),
    // 이주민 사역자료
    prisma.resource.findMany({ where: { section: 'MINISTRY' }, orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, description: true, fileType: true, driveUrl: true, accessLevel: true, createdAt: true } }).catch(() => []),
    // 이주민 관련 뉴스
    prisma.news.findMany({ where: { isVisible: true }, orderBy: { publishedAt: 'desc' }, take: 6, select: { id: true, title: true, sourceName: true, sourceUrl: true, publishedAt: true, category: true } }).catch(() => []),
  ])

  const stats = [
    { label: '가입 단체',     value: orgCount > 0      ? `${orgCount}+`      : '120+',  unit: '개' },
    { label: '이주민 대상국', value: '30+',                                              unit: '개국' },
    { label: '활동 회원',     value: memberCount > 0   ? `${memberCount}+`   : '500+',  unit: '명' },
    { label: '등록 자료',     value: resourceCount > 0 ? `${resourceCount}+` : '1200+', unit: '건' },
  ]

  const boards = [
    {
      label: '공지사항',
      href: '/story/notice',
      items: notices.map((s) => ({ id: s.id, title: s.title, date: s.createdAt, href: `/story/notice/${s.id}` })),
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
        </svg>
      ),
    },
    {
      label: '보도자료',
      href: '/story/news',
      items: newsStories.map((s) => ({ id: s.id, title: s.title, date: s.createdAt, href: `/story/${s.id}` })),
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
        </svg>
      ),
    },
    {
      label: '이주민 사역안내',
      href: '/story/event-promo',
      items: eventPromos.map((s) => ({ id: s.id, title: s.title, date: s.createdAt, href: `/story/event-promo/${s.id}` })),
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12V13.5zm0 3h.008v.008H12v-.008zm-3 0h.008v.008H9V16.5zm6 0h.008v.008H15V16.5z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* 팝업 배너 */}
      <LazyPopupBanner />

      {/* 1. 히어로 슬라이드 */}
      <HeroCarousel isLoggedIn={!!session?.user} />

      {/* 2. 숫자 카운터 */}
      <CounterSection stats={stats} />

      {/* 3. 3단 게시판 */}
      <section className="bg-[#EAF2FB] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {boards.map((board) => (
              <div key={board.label} className="flex flex-col">
                {/* 아이콘 + 제목 */}
                <div className="flex flex-col items-center mb-6 text-[#1B3A6B]">
                  {board.icon}
                  <h3 className="mt-3 text-xl font-bold">{board.label}</h3>
                </div>

                {/* 목록 */}
                <ul className="flex-1 divide-y divide-gray-200 bg-white rounded-xl shadow-sm overflow-hidden">
                  {board.items.length > 0 ? board.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
                      >
                        <span className="text-sm text-gray-700 group-hover:text-[#1B3A6B] line-clamp-1 flex-1 min-w-0">
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                          {item.date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
                        </span>
                      </Link>
                    </li>
                  )) : (
                    <li className="px-4 py-8 text-center text-sm text-gray-400">등록된 게시물이 없습니다.</li>
                  )}
                </ul>

                {/* 더 보기 */}
                <div className="mt-3 text-right">
                  <Link
                    href={board.href}
                    className="text-sm text-[#1B3A6B] font-medium hover:underline"
                  >
                    더 보기 →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 최신 사역 소식(좌) + 이주민 관련 뉴스(우) */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* 왼쪽 — 최신 사역 소식 */}
            <div className="flex flex-col">
              <div className="mb-5">
                <p className="text-xs font-semibold tracking-widest text-[#C8922A] uppercase mb-1">KIMA</p>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1B3A6B]">최신 사역 소식</h2>
                  <Link href="/story/media" className="text-sm text-[#1B3A6B] font-medium hover:underline">
                    전체 보기 →
                  </Link>
                </div>
              </div>
              {eventMedia.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 flex-1">
                  {eventMedia.map((story) => {
                    const thumb = getStoryThumb(story)
                    return (
                      <Link
                        key={story.id}
                        href={`/story/media/${story.id}`}
                        className="group block rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={story.title}
                              fill
                              sizes="(min-width: 1024px) 25vw, 50vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#EAF2FB]">
                              <svg className="w-10 h-10 text-[#1B3A6B]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                          <p className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-white font-medium line-clamp-2 leading-snug">
                            {story.title}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 py-16">
                  등록된 사진이 없습니다.
                </div>
              )}
            </div>

            {/* 오른쪽 — 이주민 관련 뉴스 */}
            <div className="flex flex-col">
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-[#C8922A] inline-block" />
                    <h2 className="text-xl font-bold text-[#1B3A6B]">이주민 관련 뉴스</h2>
                  </div>
                  <Link href="/network/news" className="text-sm text-[#1B3A6B] font-medium hover:underline">
                    더 보기 →
                  </Link>
                </div>
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {recentNews.length > 0 ? recentNews.map((news) => (
                  <a
                    key={news.id}
                    href={news.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 px-4 py-3.5 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 group-hover:text-[#1B3A6B] line-clamp-2 leading-snug transition-colors">
                        {news.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-[#C8922A] font-medium">{news.sourceName}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(news.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
                        </span>
                      </div>
                    </div>
                    <svg className="shrink-0 w-4 h-4 text-gray-300 group-hover:text-[#1B3A6B] mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )) : (
                  <div className="px-4 py-10 text-center text-sm text-gray-400">등록된 뉴스가 없습니다.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. 다가오는 일정 */}
      <section className="bg-[#F8F9FA] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#1B3A6B]">다가오는 일정</h2>
            <Link href="/network/schedule" className="text-sm text-[#1B3A6B] font-medium hover:underline">
              전체 일정 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbEvents.length > 0 ? dbEvents.map((event, idx) => (
              <Link key={event.id} href={`/network/schedule/${event.id}`}>
                <Card
                  hover
                  className={`flex items-center gap-6 p-5 cursor-pointer${idx === 0 ? ' event-nearest' : ''}`}
                >
                  <div className="shrink-0 w-14 text-center">
                    <div className="text-xs font-semibold text-[#C8922A]">
                      {event.scheduledAt.toLocaleDateString('ko-KR', { month: 'long' })}
                    </div>
                    <div className="text-3xl font-bold text-[#1B3A6B] leading-none">
                      {event.scheduledAt.getDate()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A1A1A] text-sm">{event.title}</p>
                    {event.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">{event.description}</p>
                    )}
                    <p className="mt-1.5 text-xs text-[#1B3A6B] font-medium">상세보기 →</p>
                  </div>
                </Card>
              </Link>
            )) : (
              <p className="col-span-2 text-center text-gray-400 py-10">예정된 일정이 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. 이주민 사역자료(통합) */}
      <section className="bg-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-1 h-7 rounded-full bg-[#1B3A6B] inline-block" />
              <h2 className="text-xl font-bold text-[#1B3A6B]">이주민 사역자료(통합)</h2>
            </div>
            <Link href="/resources/ministry" className="text-sm text-[#1B3A6B] font-medium hover:underline">
              더 보기 →
            </Link>
          </div>

          {/* 자료 목록 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {ministryResources.length > 0 ? ministryResources.map((res) => (
              <a
                key={res.id}
                href={res.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50 transition-colors group"
              >
                {/* 파일 타입 아이콘 */}
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#EAF2FB] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1B3A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>

                {/* 제목 · 설명 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1B3A6B] line-clamp-1 transition-colors">
                    {res.title}
                  </p>
                  {res.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{res.description}</p>
                  )}
                </div>

                {/* 파일 타입 뱃지 */}
                {res.fileType && (
                  <span className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500 uppercase">
                    {res.fileType}
                  </span>
                )}

                {/* 날짜 */}
                <span className="shrink-0 text-xs text-gray-400 tabular-nums hidden sm:block">
                  {res.createdAt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
                </span>

                {/* 화살표 */}
                <svg className="shrink-0 w-4 h-4 text-gray-300 group-hover:text-[#1B3A6B] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-gray-400">등록된 자료가 없습니다.</div>
            )}
          </div>

          {/* 더 보기 버튼 */}
          <div className="mt-4 text-center">
            <Link
              href="/resources/ministry"
              className="inline-flex items-center gap-1.5 text-sm text-[#1B3A6B] font-medium hover:underline"
            >
              더 보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. 후원 배너 */}
      <section className="bg-[#C8922A] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">이주민 선교를 함께 후원해 주세요</h2>
          <p className="text-amber-100 text-base mb-8 leading-relaxed">
            여러분의 후원이 전국 이주민 사역 현장에 희망을 전달합니다.<br />
            소액이라도 큰 변화를 만들어냅니다.
          </p>
          <Link
            href="/donate"
            className="inline-flex items-center px-8 py-3.5 rounded-lg bg-white text-[#C8922A] font-bold hover:bg-amber-50 transition-colors shadow-sm"
          >
            후원하기
          </Link>
        </div>
      </section>
    </>
  )
}
