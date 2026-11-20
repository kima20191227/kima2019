import { auth } from '@/lib/auth'
import { hasAdminMenu } from '@/lib/adminAccess'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ForumArchiveForm } from '@/components/admin/ForumArchiveForm'
import { DeleteButton } from '@/components/admin/DeleteButton'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: '포럼&리스닝콜 아카이브 관리 | KIMA 관리자' }

const TYPE_LABELS: Record<string, string> = {
  FORUM:          '🏛 포럼',
  LISTENING_CALL: '🎙 리스닝콜',
}

export default async function AdminForumArchivesPage() {
  const session = await auth()
  const role = session?.user?.role
  if (!(await hasAdminMenu(session, 'forumArchives'))) redirect('/')

  const archives = await prisma.forumArchive.findMany({
    include: {
      schedules: { orderBy: { order: 'asc' } },
      materials: { orderBy: { order: 'asc' } },
      _count: { select: { materials: true, schedules: true } },
    },
    orderBy: { createdAt: 'desc' },
  }).catch(() => [])

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">포럼&amp;리스닝콜 아카이브 관리</h1>
          <p className="text-sm text-gray-500 mt-1">포럼·리스닝콜 자료, 사진, 영상을 등록하고 관리합니다.</p>
        </div>
        <ForumArchiveForm mode="create" />
      </div>

      {archives.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-400">
          <p className="text-3xl mb-3">📂</p>
          <p>등록된 아카이브가 없습니다.</p>
          <p className="text-xs mt-1">위의 &apos;새 아카이브 등록&apos; 버튼으로 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {archives.map((archive) => (
            <div key={archive.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      archive.type === 'FORUM'
                        ? 'bg-[#1B3A6B]/10 text-[#1B3A6B]'
                        : 'bg-[#C8922A]/10 text-[#C8922A]'
                    }`}>
                      {TYPE_LABELS[archive.type] ?? archive.type}
                    </span>
                    <span className="text-xs text-gray-400">{archive.seq}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      archive.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {archive.isPublished ? '공개' : '비공개'}
                    </span>
                  </div>

                  <p className="font-semibold text-gray-800 text-sm">{archive.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {archive.date}
                    {archive.location && ` · ${archive.location}`}
                  </p>

                  {archive.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{archive.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {archive._count.schedules > 0 && (
                      <span>📅 일정 {archive._count.schedules}건</span>
                    )}
                    {archive._count.materials > 0 && (
                      <span>📎 자료 {archive._count.materials}건</span>
                    )}
                    {archive.photos.length > 0 && (
                      <span>🖼 사진 {archive.photos.length}장</span>
                    )}
                    {archive.videoUrls.length > 0 && (
                      <span>🎬 영상 {archive.videoUrls.length}개</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <ForumArchiveForm
                    mode="edit"
                    initialData={{
                      id: archive.id,
                      seq: archive.seq,
                      type: archive.type,
                      title: archive.title,
                      date: archive.date,
                      location: archive.location,
                      theme: archive.theme,
                      description: archive.description,
                      videoUrls: archive.videoUrls,
                      photos: archive.photos,
                      isPublished: archive.isPublished,
                      schedules: archive.schedules,
                      materials: archive.materials,
                    }}
                  />
                  <DeleteButton
                    url={`/api/admin/forum-archives/${archive.id}`}
                    label="삭제"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
