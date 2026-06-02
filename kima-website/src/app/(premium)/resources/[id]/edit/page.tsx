import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { ResourceEditForm } from '@/components/resources/ResourceEditForm'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

const ROLE_WEIGHT: Record<UserRole, number> = { MEMBER: 1, PREMIUM: 2, OFFICER: 3, ADMIN: 4 }

const SECTION_BACK: Record<string, string> = {
  KIMA: '/resources/kima',
  MINISTRY: '/resources/ministry',
  PUBLIC: '/resources/public',
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const resource = await prisma.resource.findUnique({ where: { id }, select: { title: true } })
  return { title: resource ? `${resource.title} 수정 | KIMA` : '자료 수정 | KIMA' }
}

export default async function ResourceEditPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const role = session.user.role as UserRole
  const weight = ROLE_WEIGHT[role] ?? 0

  const [resource, categories] = await Promise.all([
    prisma.resource.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    }),
  ])

  if (!resource) notFound()

  const isAdmin = weight >= 4
  const isOfficer = weight >= 3
  const isOwner = resource.uploadedById === session.user.id

  const canEdit = isAdmin || (isOfficer && resource.section !== 'PUBLIC') || isOwner
  if (!canEdit) redirect('/')

  const backHref = SECTION_BACK[resource.section] ?? '/resources/ministry'

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="bg-[#1B3A6B] text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-sm text-blue-200 hover:text-white mb-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            목록으로 돌아가기
          </Link>
          <h1 className="text-xl font-bold">자료 수정</h1>
          <p className="text-blue-200 text-sm mt-1">
            {resource.category?.name
              ? `${resource.category.name} 카테고리의 자료를 수정합니다.`
              : '자료 내용을 수정합니다.'}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <ResourceEditForm
          resource={{
            id: resource.id,
            title: resource.title,
            description: resource.description,
            content: resource.content ?? null,
            thumbnail: resource.thumbnail ?? null,
            driveUrl: resource.driveUrl,
            fileUrls: resource.fileUrls ?? [],
            accessLevel: resource.accessLevel,
            section: resource.section as 'KIMA' | 'MINISTRY' | 'PUBLIC',
            category: resource.category,
          }}
          categories={categories}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
