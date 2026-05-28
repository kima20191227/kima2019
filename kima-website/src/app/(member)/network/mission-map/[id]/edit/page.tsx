import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OrgEditClient } from '../OrgEditClient'

async function findOrg(id: string) {
  const numeric = parseInt(id, 10)
  if (!isNaN(numeric)) {
    const org = await prisma.organization.findUnique({ where: { gmfsnsId: numeric } })
    if (org) return org
  }
  return prisma.organization.findUnique({ where: { id } })
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const org = await findOrg(id)
  return { title: org ? `${org.name} 정보 수정 | KIMA` : '단체 정보 수정 | KIMA' }
}

export default async function OrgEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/network/mission-map')
  }

  const { id } = await params
  const org = await findOrg(id)
  if (!org) notFound()

  const initial = {
    type: org.type ?? '',
    representative: org.representative ?? '',
    targets: org.targets ?? [],
    languages: org.languages ?? [],
    address: org.address ?? '',
    phone: org.phone ?? '',
    email: org.email ?? '',
    website: org.website ?? '',
    introLines: org.introLines ?? [],
    contactItems: org.contactItems ?? [],
  }

  const currentImage: string | null = org.image ?? null

  const editId: number | string = org.gmfsnsId ?? org.id

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
        <div className="max-w-3xl mx-auto text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
          <Link href="/network/mission-map" className="hover:text-[#1B3A6B]">유형별 단체 현황</Link>
          <span>/</span>
          <Link href={`/network/mission-map/${id}`} className="hover:text-[#1B3A6B] truncate max-w-[200px]">{org.name}</Link>
          <span>/</span>
          <span className="text-gray-600 font-medium">정보 수정</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900">{org.name}</h1>
          <p className="text-sm text-gray-500 mt-1">단체 정보를 수정하고 저장해주세요. 수정한 내용은 즉시 반영됩니다.</p>
        </div>

        <OrgEditClient orgId={editId} routeId={id} initial={initial} currentImage={currentImage} />
      </div>
    </div>
  )
}
