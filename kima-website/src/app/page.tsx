import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { PopupBanner } from '@/components/home/PopupBanner'
import { CounterSection } from '@/components/home/CounterSection'
import { prisma } from '@/lib/prisma'
import type { StoryType } from '@prisma/client'

export const revalidate = 3600 // 1시간마다 백그라운드 재생성

const STORY_CATEGORIES: { type: StoryType; label: string; barCls: string; topCls: string }[] = [
  { type: 'NEWS',            label: 'KIMA 뉴스',       barCls: 'bg-[#1B3A6B]', topCls: 'bg-[#1B3A6B]' },
  { type: 'FIELD_STORY',    label: '사역현장 이야기',   barCls: 'bg-[#2E7D32]', topCls: 'bg-[#2E7D32]' },
  { type: 'EVENT_MEDIA',    label: '행사 사진·영상',    barCls: 'bg-[#6A1B9A]', topCls: 'bg-[#6A1B9A]' },
  { type: 'PRAYER_REQUEST', label: '중보기도 요청',     barCls: 'bg-[#C8922A]', topCls: 'bg-[#C8922A]' },
  { type: 'EVENT_PROMO',    label: '행사 홍보',         barCls: 'bg-[#0277BD]', topCls: 'bg-[#0277BD]' },
]

function storyHref(id: string, type: StoryType) {
  return type === 'EVENT_PROMO' ? `/story/event-promo/${id}` : `/story/${id}`
}

export default async function HomePage() {
  const [
    newsStories, fieldStories, eventMediaStories, prayerStories, eventPromoStories,
    dbEvents, orgCount, memberCount, resourceCount,
  ] = await Promise.all([
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'NEWS'           }, orderBy: { createdAt: 'desc' }, take: 2 }).catch((e) => { console.error('[home] stories/NEWS:', e); return [] }),
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'FIELD_STORY'   }, orderBy: { createdAt: 'desc' }, take: 2 }).catch((e) => { console.error('[home] stories/FIELD_STORY:', e); return [] }),
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'EVENT_MEDIA'   }, orderBy: { createdAt: 'desc' }, take: 2 }).catch((e) => { console.error('[home] stories/EVENT_MEDIA:', e); return [] }),
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'PRAYER_REQUEST'}, orderBy: { createdAt: 'desc' }, take: 2 }).catch((e) => { console.error('[home] stories/PRAYER_REQUEST:', e); return [] }),
    prisma.story.findMany({ where: { isPublished: true, status: 'APPROVED', type: 'EVENT_PROMO'   }, orderBy: { createdAt: 'desc' }, take: 2 }).catch((e) => { console.error('[home] stories/EVENT_PROMO:', e); return [] }),
    prisma.event.findMany({ where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: 'asc' }, take: 4 }).catch((e) => { console.error('[home] events:', e); return [] }),
    prisma.organization.count({ where: { isPublic: true } }).catch((e) => { console.error('[home] orgCount:', e); return 0 }),
    prisma.user.count().catch((e) => { console.error('[home] memberCount:', e); return 0 }),
    prisma.resource.count().catch((e) => { console.error('[home] resourceCount:', e); return 0 }),
  ])

  const storyGroups = [
    { ...STORY_CATEGORIES[0], stories: newsStories },
    { ...STORY_CATEGORIES[1], stories: fieldStories },
    { ...STORY_CATEGORIES[2], stories: eventMediaStories },
    { ...STORY_CATEGORIES[3], stories: prayerStories },
    { ...STORY_CATEGORIES[4], stories: eventPromoStories },
  ].filter((g) => g.stories.length > 0)

  const hasAnyStory = storyGroups.length > 0

  const stats = [
    { label: '가입 단체',     value: orgCount > 0      ? `${orgCount}+`      : '120+',   unit: '개' },
    { label: '이주민 대상국', value: '30+',                                               unit: '개국' },
    { label: '활동 회원',     value: memberCount > 0   ? `${memberCount}+`   : '500+',   unit: '명' },
    { label: '등록 자료',     value: resourceCount > 0 ? `${resourceCount}+` : '1200+',  unit: '건' },
  ]

  return (
    <>
      {/* 팝업 배너 */}
      <PopupBanner />

      {/* 1. 히어로 슬라이드 */}
      <HeroCarousel />

      {/* 2. 숫자 카운터 */}
      <CounterSection stats={stats} />

      {/* 3. 최신 스토리 — 카테고리별 2개 */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-[#1B3A6B]">최신 스토리</h2>
              <p className="mt-2 text-sm text-gray-500">현장의 이야기를 카테고리별로 전합니다</p>
            </div>
            <Link href="/story" className="text-sm text-[#1B3A6B] font-medium hover:underline">
              전체 보기 →
            </Link>
          </div>

          {hasAnyStory ? (
            <div className="space-y-12">
              {storyGroups.map(({ type, label, barCls, topCls, stories }) => (
                <div key={type}>
                  {/* 카테고리 헤더 */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1 h-6 rounded-full inline-block ${barCls}`} />
                      <h3 className="text-lg font-bold text-[#1A1A1A]">{label}</h3>
                    </div>
                    <Link
                      href={`/story?type=${type}`}
                      className="text-xs text-gray-400 hover:text-[#1B3A6B] transition-colors"
                    >
                      더 보기 →
                    </Link>
                  </div>

                  {/* 2열 카드 그리드 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stories.map((story) => (
                      <Link key={story.id} href={storyHref(story.id, story.type)}>
                        <Card hover className="overflow-hidden h-full">
                          <div className={`h-1.5 rounded-t-xl ${topCls}`} />
                          <CardContent className="p-5">
                            <h4 className="text-sm font-bold text-[#1A1A1A] leading-snug line-clamp-2 mb-2">
                              {story.title}
                            </h4>
                            {story.excerpt && (
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                                {story.excerpt}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {story.createdAt.toLocaleDateString('ko-KR')}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16">등록된 스토리가 없습니다.</p>
          )}
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
            {dbEvents.length > 0 ? dbEvents.map((event) => (
              <Card key={event.id} className="flex items-center gap-6 p-5">
                <div className="shrink-0 w-14 text-center">
                  <div className="text-xs font-semibold text-[#C8922A]">
                    {event.scheduledAt.toLocaleDateString('ko-KR', { month: 'long' })}
                  </div>
                  <div className="text-3xl font-bold text-[#1B3A6B] leading-none">
                    {event.scheduledAt.getDate()}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A] text-sm">{event.title}</p>
                  {event.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">{event.description}</p>
                  )}
                </div>
              </Card>
            )) : (
              <p className="col-span-2 text-center text-gray-400 py-10">예정된 일정이 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. 후원 배너 */}
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
