import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanitizeRichHtml } from '@/lib/sanitizeHtml'
import { AttachmentSection, type Attachment } from '@/components/ui/AttachmentSection'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const prayer = await prisma.story.findUnique({
    where: { id, type: 'PRAYER_REQUEST', isPublished: true },
    select: { title: true },
  })
  if (!prayer) return { title: '중보기도 요청 | KIMA' }
  return { title: `${prayer.title} | KIMA 중보기도` }
}

export default async function PrayerDetailPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const prayer = await prisma.story.findUnique({
    where: { id, type: 'PRAYER_REQUEST', isPublished: true, status: 'APPROVED' },
  })

  if (!prayer) notFound()

  // 공개 범위 접근 제어
  if (prayer.visibility === 'MEMBER' && !session) notFound()
  if (
    prayer.visibility === 'PRAYER_TEAM' &&
    session?.user?.role !== 'ADMIN' &&
    session?.user?.role !== 'OFFICER'
  )
    notFound()

  const isUrgent = prayer.urgency === 'URGENT'
  const attachments = (prayer.attachments ?? []) as unknown as Attachment[]

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* 헤더 */}
      <div className={`text-white py-12 px-4 ${isUrgent ? 'bg-red-700' : 'bg-[#1B3A6B]'}`}>
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-3">
            Prayer
          </p>
          <div className="flex items-start gap-3 mb-4">
            {isUrgent && (
              <span className="shrink-0 mt-0.5 flex items-center gap-1 px-2.5 py-0.5 bg-red-500/40 border border-red-300/40 text-red-100 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse" />
                긴급
              </span>
            )}
            {prayer.isAnswered && (
              <span className="shrink-0 mt-0.5 px-2.5 py-0.5 bg-green-500/30 border border-green-300/30 text-green-100 rounded-full text-xs font-semibold">
                응답됨
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-snug">{prayer.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-blue-200">
            <span>{prayer.requesterName ?? '익명'}</span>
            <span>·</span>
            <span>{new Date(prayer.createdAt).toLocaleDateString('ko-KR')}</span>
            {prayer.visibility === 'MEMBER' && (
              <>
                <span>·</span>
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">회원 공개</span>
              </>
            )}
            {prayer.visibility === 'PRAYER_TEAM' && (
              <>
                <span>·</span>
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-xs">기도팀 공개</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* 본문 */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 text-gray-800
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-gray-900
            [&_p]:my-3 [&_p]:leading-[1.85] [&_p]:text-gray-700
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:space-y-1
            [&_li]:text-gray-700 [&_li]:leading-relaxed
            [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-4 [&_img]:mx-auto
            [&_strong]:font-semibold [&_strong]:text-gray-900
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#C8922A] [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-gray-600 [&_blockquote]:italic
            [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2
            [&_hr]:my-6 [&_hr]:border-gray-200"
          dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(prayer.content) }}
        />

        {/* 첨부파일 (이미지 갤러리 + PDF 뷰어 + 문서 다운로드) — 신규 글 */}
        {attachments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <AttachmentSection attachments={attachments} />
          </div>
        )}

        {/* 첨부 사진 — 구 글 하위호환 (attachments 없을 때만) */}
        {attachments.length === 0 && prayer.images && (prayer.images as string[]).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">첨부 사진</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(prayer.images as string[]).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`첨부 사진 ${i + 1}`}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              ))}
            </div>
          </div>
        )}

        {/* 기도 격려 문구 */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 text-sm text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">🙏 함께 기도해 주세요</p>
          <p>이 기도 제목을 위해 잠시 멈추고 기도해 주시면 감사하겠습니다. 기도가 현장을 바꿉니다.</p>
        </div>

        {/* 목록으로 */}
        <div>
          <Link
            href="/story/prayer"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로
          </Link>
        </div>
      </div>
    </div>
  )
}
