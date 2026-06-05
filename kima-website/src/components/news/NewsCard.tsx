import { getNewsCategoryMeta, type NewsCategoryConfig } from '@/lib/newsCategoryConfig'

export interface NewsCardItem {
  id: string
  title: string
  summary: string | null
  sourceUrl: string
  sourceName: string
  category: string
  publishedAt: Date | string
  relevanceScore: number | null
  keywords: string[]
}

export function NewsCard({
  item,
  categories,
}: {
  item: NewsCardItem
  categories: NewsCategoryConfig[]
}) {
  const meta = getNewsCategoryMeta(categories, item.category)

  const date = new Date(item.publishedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const relevance = item.relevanceScore != null
    ? Math.round(item.relevanceScore * 100)
    : null

  return (
    <article className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#C8922A]/40 transition-all p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.colorClass}`}>
          {meta.label}
        </span>
        {relevance !== null && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3 text-[#C8922A]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            관련도 {relevance}%
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-gray-900 leading-snug">
        {item.title}
      </h3>

      {item.summary && (
        <div className="bg-[#F8F9FA] rounded-lg px-3.5 py-2.5 border-l-2 border-[#1B3A6B]/30">
          <p className="text-xs font-semibold text-[#1B3A6B] mb-1">AI 요약</p>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">
            {item.summary}
          </p>
        </div>
      )}

      {item.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.keywords.slice(0, 4).map((kw) => (
            <span
              key={kw}
              className="px-2 py-0.5 rounded text-[11px] bg-[#1B3A6B]/5 text-[#1B3A6B]"
            >
              #{kw}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 mt-auto">
        <span className="text-xs text-gray-400 whitespace-nowrap">{date}</span>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#C8922A] hover:text-[#b07a20] transition-colors"
        >
          원문 보기
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </article>
  )
}
