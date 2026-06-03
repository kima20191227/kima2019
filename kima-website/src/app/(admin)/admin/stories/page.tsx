import { prisma } from '@/lib/prisma'
import { StoryForm } from '@/components/admin/StoryForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { StoryApproveButton } from '@/components/admin/StoryApproveButton'
import { PrayerAnsweredButton } from '@/components/admin/PrayerAnsweredButton'
import { StoryEditButton } from '@/components/admin/StoryEditButton'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '현장스토리 관리 | KIMA 관리자' }

const TYPE_LABELS: Record<string, string> = {
  NOTICE:         '📢 공지사항',
  NEWS:           '📰 KIMA 보도자료',
  FIELD_STORY:    '✍️ 현장 이야기',
  EVENT_MEDIA:    '📸 KIMA 행사&영상',
  EVENT_PROMO:    '📣 이주민 사역안내',
  PRAYER_REQUEST: '🙏 중보기도',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:  '검토 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
}

type Story = Awaited<ReturnType<typeof prisma.story.findMany>>[number] & {
  author: { name: string | null } | null
}

export default async function AdminStoriesPage() {
  const stories = await prisma.story.findMany({
    include: { author: { select: { name: true } } },
    orderBy: [{ createdAt: 'desc' }],
  }) as Story[]

  const pending  = stories.filter((s) => s.status === 'PENDING')
  const rest     = stories.filter((s) => s.status !== 'PENDING')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#1B3A6B]">현장스토리 관리</h1>
        <p className="text-sm text-gray-500 mt-1">뉴스·현장 이야기·KIMA 행사&영상·이주민사역 행사 홍보·중보기도를 관리합니다.</p>
      </div>

      <StoryForm />

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            검토 대기 ({pending.length}건)
          </h2>
          <div className="space-y-3">
            {pending.map((story) => (
              <StoryCard key={story.id} story={story} showActions />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">전체 목록</h2>
        {rest.length === 0 && pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-400">
            등록된 스토리가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {rest.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StoryCard({ story, showActions }: { story: Story; showActions?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {TYPE_LABELS[story.type] ?? story.type}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[story.status] ?? ''}`}>
              {STATUS_LABELS[story.status] ?? story.status}
            </span>
            {!story.isPublished && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-400">비공개</span>
            )}
          </div>

          <p className="font-semibold text-gray-900 text-sm mb-1">{story.title}</p>

          <p className="text-xs text-gray-500 line-clamp-2 mb-1">
            {story.content.slice(0, 150)}
          </p>

          {story.linkUrl && (
            <a
              href={story.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline truncate block"
            >
              🔗 {story.linkUrl}
            </a>
          )}

          <p className="text-xs text-gray-400 mt-2">
            {story.authorName ?? story.author?.name ?? '익명'} ·{' '}
            {story.createdAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {showActions && (
            <div className="flex gap-2 mt-3">
              <StoryApproveButton storyId={story.id} action="approve" />
              <StoryApproveButton storyId={story.id} action="reject" />
            </div>
          )}

          {story.type === 'PRAYER_REQUEST' && !showActions && (
            <div className="mt-3">
              <PrayerAnsweredButton storyId={story.id} isAnswered={story.isAnswered} />
            </div>
          )}
        </div>

        <DeleteButton url={`/api/stories/${story.id}`} />
      </div>

      <StoryEditButton story={story} />
    </div>
  )
}
