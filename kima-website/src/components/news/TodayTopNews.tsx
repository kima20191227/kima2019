import type { TopNewsItem } from '@/lib/majorNewsOutlets'

function formatTime(date: Date, now: Date): string {
  const sameDay =
    date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) ===
    now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })

  return sameDay
    ? date.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' })
}

function ExternalIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  )
}

function OutletBadge({ item }: { item: TopNewsItem }) {
  const tone = item.outlet.group === 'christian'
    ? 'bg-[#C8922A]/10 text-[#9a6d1c]'
    : 'bg-[#1B3A6B]/10 text-[#1B3A6B]'
  return (
    <span className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${tone}`}>
      {item.outlet.name}
    </span>
  )
}

/**
 * 오늘의 주요 뉴스 — 제목만 나열하고, 누르면 AI 요약이 펼쳐진다.
 * 요약이 없는 기사는 제목이 곧 원문 링크(새 창)다.
 * <details> 기반이라 클라이언트 JS 없이 동작한다 (카카오톡 인앱 브라우저 대응).
 */
export function TodayTopNews({
  items,
  windowHours,
  now = new Date(),
}: {
  items: TopNewsItem[]
  windowHours: number
  now?: Date
}) {
  if (items.length === 0) return null

  const heading = windowHours <= 24 ? '오늘의 주요 뉴스' : '최근 주요 뉴스'

  return (
    <section
      aria-labelledby="today-top-news-heading"
      className="mb-8 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-gray-100 bg-[#1B3A6B]/[0.03]">
        <h2 id="today-top-news-heading" className="text-base font-bold text-[#1B3A6B] flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-sm bg-[#C8922A]" aria-hidden="true" />
          {heading}
        </h2>
        <p className="text-[11px] text-gray-400">주요 일간지·기독교 언론 · 제목을 누르면 요약</p>
      </div>

      <ol className="divide-y divide-gray-100">
        {items.map((item) => {
          const time = formatTime(item.publishedAt, now)
          const summary = item.summary?.trim()

          if (!summary) {
            return (
              <li key={item.id}>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <OutletBadge item={item} />
                  <span className="flex-1 min-w-0 text-sm text-gray-900 truncate">{item.title}</span>
                  <span className="shrink-0 text-xs text-gray-400 inline-flex items-center gap-1">
                    {time}
                    <ExternalIcon />
                  </span>
                </a>
              </li>
            )
          }

          return (
            <li key={item.id}>
              <details className="group">
                <summary className="flex items-center gap-2.5 px-4 sm:px-5 py-3 cursor-pointer list-none hover:bg-gray-50 transition-colors [&::-webkit-details-marker]:hidden">
                  <OutletBadge item={item} />
                  <span className="flex-1 min-w-0 text-sm text-gray-900 truncate group-open:whitespace-normal group-open:font-semibold">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{time}</span>
                  <svg
                    className="shrink-0 w-4 h-4 text-gray-400 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-4 sm:px-5 pb-4">
                  <div className="bg-[#F8F9FA] rounded-lg px-3.5 py-2.5 border-l-2 border-[#1B3A6B]/30">
                    <p className="text-xs font-semibold text-[#1B3A6B] mb-1">AI 요약</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">{summary}</p>
                  </div>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[#C8922A] hover:text-[#b07a20] transition-colors"
                  >
                    {item.outlet.name}에서 원문 보기
                    <ExternalIcon />
                  </a>
                </div>
              </details>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
