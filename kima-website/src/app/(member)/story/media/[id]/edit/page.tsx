import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { MediaEditForm } from './MediaEditForm'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: '행사 사진·영상 수정 | KIMA' }

export default async function MediaEditPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const { id } = await params
  const story = await prisma.story.findUnique({
    where: { id, type: 'EVENT_MEDIA' },
    select: {
      id: true, title: true, content: true, excerpt: true,
      eventLocation: true, publishedAt: true,
      thumbnail: true, images: true, attachments: true, videoUrls: true, tags: true, authorId: true,
    },
  }).catch(() => null)

  if (!story) notFound()

  const isOwner = story.authorId === session.user.id
  const isOfficer = session.user.role === 'ADMIN' || session.user.role === 'OFFICER'
  if (!isOwner && !isOfficer) redirect(`/story/media/${id}`)

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-1">행사 사진·영상 수정</h1>
        <p className="text-sm text-gray-500 mb-8">등록된 갤러리 내용을 수정합니다.</p>
        <MediaEditForm
          story={{
            ...story,
            attachments: (story.attachments as unknown as { url: string; name: string; type: string; isCover?: boolean }[] | null) ?? null,
          }}
        />
      </div>
    </div>
  )
}
