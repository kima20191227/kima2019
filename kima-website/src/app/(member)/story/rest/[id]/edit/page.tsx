import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { RestWalkEditForm } from './RestWalkEditForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '글 수정 | 쉬어가는 발걸음' }

type Props = { params: Promise<{ id: string }> }

export default async function RestWalkEditPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  if (!session?.user) redirect(`/auth/login?callbackUrl=/story/rest/${id}/edit`)

  const story = await prisma.story.findUnique({
    where: { id, type: 'REST_WALK' },
    select: {
      id: true, title: true, content: true, excerpt: true,
      authorName: true, ministryLocation: true, videoUrls: true, tags: true,
      thumbnail: true, images: true, attachments: true,
      authorId: true,
    },
  })

  if (!story) notFound()

  const isOwner = story.authorId === session.user.id
  const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'OFFICER'
  if (!isOwner && !isAdmin) redirect('/story/rest')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C8922A] text-sm font-semibold tracking-widest uppercase mb-2">Rest &amp; Walk</p>
          <h1 className="text-2xl font-bold">글 수정</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <RestWalkEditForm
            story={{
              ...story,
              attachments: (story.attachments as unknown as { url: string; name: string; type: string }[] | null) ?? null,
            }}
          />
        </div>
      </div>
    </div>
  )
}
