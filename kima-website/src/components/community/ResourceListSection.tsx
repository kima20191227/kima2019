'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ResourceUploadForm } from './ResourceUploadForm'
import type { AccessLevel } from '@prisma/client'

interface Resource {
  id: string
  title: string
  description: string | null
  driveUrl: string
  fileType: string | null
  accessLevel: AccessLevel
  categoryId: string | null
  uploadedById: string | null
  createdAt: Date
  updatedAt: Date
}

interface ResourceListSectionProps {
  resources: Resource[]
  categoryId: string
  categoryName: string
  userId: string | null
  roleWeight: number
  isPremium: boolean
}

function AccessBadge({ level }: { level: AccessLevel }) {
  if (level === 'PUBLIC') return null
  if (level === 'MEMBER')
    return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">회원</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">정회원</span>
}

function ResourceItem({
  resource,
  canAccess,
  canEdit,
  isLoggedIn,
}: {
  resource: Resource
  canAccess: boolean
  canEdit: boolean
  roleWeight: number
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!window.confirm(`"${resource.title}" 자료를 삭제하시겠습니까?`)) return
    startTransition(async () => {
      const res = await fetch(`/api/resources/${resource.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? '삭제에 실패했습니다.')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-700 truncate">{resource.title}</span>
          <AccessBadge level={resource.accessLevel} />
        </div>
        {resource.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{resource.description}</p>
        )}
        {canEdit && (
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => router.push(`/resources/${resource.id}/edit`)}
              className="text-xs text-[#1B3A6B] hover:underline"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-red-400 hover:underline disabled:opacity-50"
            >
              삭제
            </button>
          </div>
        )}
      </div>
      {canAccess ? (
        <a
          href={resource.driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs text-[#1B3A6B] font-medium hover:underline"
        >
          열기
        </a>
      ) : (
        <Link
          href={
            !isLoggedIn
              ? '/auth/login'
              : resource.accessLevel === 'PREMIUM'
                ? '/member/upgrade'
                : '/auth/login'
          }
          className="shrink-0 text-xs text-gray-400"
          title={!isLoggedIn ? '로그인이 필요합니다' : resource.accessLevel === 'PREMIUM' ? '정회원 전용' : '회원 전용'}
        >
          🔒
        </Link>
      )}
    </div>
  )
}

export function ResourceListSection({
  resources,
  categoryId,
  categoryName,
  userId,
  roleWeight,
  isPremium,
}: ResourceListSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#1B3A6B] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
          사역자료
        </h2>
        {roleWeight >= 1 && userId && (
          <ResourceUploadForm categoryId={categoryId} categoryName={categoryName} />
        )}
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">등록된 자료가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => {
            const canAccess =
              resource.accessLevel === 'PUBLIC' ||
              (resource.accessLevel === 'MEMBER' && roleWeight >= 1) ||
              (resource.accessLevel === 'PREMIUM' && isPremium)

            const canEdit =
              !!userId && (
                resource.uploadedById === userId ||
                roleWeight >= 3
              )

            return (
              <ResourceItem
                key={resource.id}
                resource={resource}
                canAccess={canAccess}
                canEdit={canEdit}
                roleWeight={roleWeight}
                isLoggedIn={!!userId}
              />
            )
          })}
        </div>
      )}

      {!isPremium && resources.some((r) => r.accessLevel === 'PREMIUM') && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-2">정회원 전용 자료가 있습니다</p>
          <Link
            href="/member/upgrade"
            className="text-xs text-[#C8922A] font-medium hover:underline"
          >
            정회원 신청하기 →
          </Link>
        </div>
      )}
    </div>
  )
}
