'use client'

import { useState, useTransition } from 'react'
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

interface EditFormState {
  title: string
  description: string
  driveUrl: string
  accessLevel: string
}

function ResourceItem({
  resource,
  canAccess,
  canEdit,
  roleWeight,
}: {
  resource: Resource
  canAccess: boolean
  canEdit: boolean
  roleWeight: number
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [editError, setEditError] = useState('')
  const [form, setForm] = useState<EditFormState>({
    title: resource.title,
    description: resource.description ?? '',
    driveUrl: resource.driveUrl,
    accessLevel: resource.accessLevel,
  })

  const set = (k: keyof EditFormState, v: string) => setForm((prev) => ({ ...prev, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) { setEditError('제목을 입력해주세요.'); return }
    if (!form.driveUrl.trim()) { setEditError('구글 드라이브 URL을 입력해주세요.'); return }
    if (!form.driveUrl.includes('drive.google.com')) {
      setEditError('구글 드라이브 링크만 등록 가능합니다 (drive.google.com)'); return
    }
    setEditError('')

    startTransition(async () => {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          driveUrl: form.driveUrl.trim(),
          accessLevel: form.accessLevel,
          categoryId: resource.categoryId ?? undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setEditError(data.error ?? '수정에 실패했습니다.')
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

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

  if (editing) {
    return (
      <div className="border border-[#1B3A6B]/20 rounded-xl p-3 bg-blue-50/50 space-y-2">
        <div>
          <label htmlFor={`edit-title-${resource.id}`} className="block text-xs text-gray-500 mb-1">제목 *</label>
          <input
            id={`edit-title-${resource.id}`}
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            disabled={isPending}
            placeholder="자료 제목"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
          />
        </div>
        <div>
          <label htmlFor={`edit-url-${resource.id}`} className="block text-xs text-gray-500 mb-1">구글 드라이브 URL *</label>
          <input
            id={`edit-url-${resource.id}`}
            type="url"
            value={form.driveUrl}
            onChange={(e) => set('driveUrl', e.target.value)}
            disabled={isPending}
            placeholder="https://drive.google.com/..."
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
          />
        </div>
        <div>
          <label htmlFor={`edit-desc-${resource.id}`} className="block text-xs text-gray-500 mb-1">설명 (선택)</label>
          <input
            id={`edit-desc-${resource.id}`}
            type="text"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            disabled={isPending}
            placeholder="간단한 설명"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] bg-white"
          />
        </div>
        {roleWeight >= 3 && (
          <div>
            <label htmlFor={`edit-access-${resource.id}`} className="block text-xs text-gray-500 mb-1">접근 등급</label>
            <select
              id={`edit-access-${resource.id}`}
              value={form.accessLevel}
              onChange={(e) => set('accessLevel', e.target.value)}
              disabled={isPending}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            >
              <option value="PUBLIC">공개</option>
              <option value="MEMBER">회원</option>
              <option value="PREMIUM">정회원</option>
            </select>
          </div>
        )}
        {editError && <p className="text-xs text-red-500">{editError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-3 py-1 rounded-lg bg-[#1B3A6B] text-white text-xs font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
          >
            {isPending ? '저장 중…' : '저장'}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setEditError('') }}
            className="px-3 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    )
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
              onClick={() => setEditing(true)}
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
          href={resource.accessLevel === 'PREMIUM' ? '/member/upgrade' : '/auth/login'}
          className="shrink-0 text-xs text-gray-400"
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
