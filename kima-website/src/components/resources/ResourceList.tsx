'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AccessLevel } from '@prisma/client'

export interface Resource {
  id: string
  title: string
  description: string | null
  content?: string | null
  driveUrl: string
  fileType: string | null
  accessLevel: AccessLevel
  section?: string | null
  uploadedById?: string | null
  createdAt: string | Date
  category?: { id: string; name: string; slug: string } | null
}

export interface ResourceListProps {
  resources: Resource[]
  userAccessLevel: 'none' | 'member' | 'premium'
  searchable?: boolean
  /** 'all' = 이 목록의 모든 자료를 수정/삭제 가능 (OFFICER+) */
  /** 'own' = 본인이 등록한 자료만 수정/삭제 가능 */
  deleteMode?: 'all' | 'own' | null
  currentUserId?: string
  onEdit?: (resource: Resource) => void
}

const ACCESS_BADGES: Record<AccessLevel, { label: string; className: string }> = {
  PUBLIC: { label: '공개', className: 'bg-gray-100 text-gray-600' },
  MEMBER: { label: '회원', className: 'bg-blue-100 text-blue-700' },
  PREMIUM: { label: '정회원', className: 'bg-amber-100 text-amber-700' },
}

function canAccess(resourceLevel: AccessLevel, userLevel: 'none' | 'member' | 'premium'): boolean {
  if (resourceLevel === 'PUBLIC') return true
  if (resourceLevel === 'MEMBER') return userLevel === 'member' || userLevel === 'premium'
  if (resourceLevel === 'PREMIUM') return userLevel === 'premium'
  return false
}

function LockIcon({ gold }: { gold?: boolean }) {
  return (
    <svg
      className={cn('w-4 h-4 flex-shrink-0', gold ? 'text-amber-500' : 'text-blue-400')}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ResourceRow({
  resource,
  userAccessLevel,
  canManage,
  onEdit,
}: {
  resource: Resource
  userAccessLevel: 'none' | 'member' | 'premium'
  canManage: boolean
  onEdit?: (resource: Resource) => void
}) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)

  const accessible = canAccess(resource.accessLevel, userAccessLevel)
  const badge = ACCESS_BADGES[resource.accessLevel]
  const date = new Date(resource.createdAt).toLocaleDateString('ko-KR')
  const hasContent = !!resource.content?.trim()

  const handleDelete = async () => {
    if (!confirm(`"${resource.title}" 자료를 삭제하시겠습니까?`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/resources/${resource.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        alert((data as { error?: string }).error ?? '삭제에 실패했습니다.')
        setIsDeleting(false)
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
      setIsDeleting(false)
    }
  }

  return (
    <div className={cn('py-4 px-2 transition-colors', accessible ? 'hover:bg-gray-50' : 'opacity-60')}>
      <div className="flex items-start gap-3">
        {/* 제목 + 메타 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{resource.title}</span>

            {/* 접근 등급 */}
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                badge.className,
              )}
            >
              {resource.accessLevel !== 'PUBLIC' && (
                <LockIcon gold={resource.accessLevel === 'PREMIUM'} />
              )}
              {badge.label}
            </span>

            {/* 파일 형식 */}
            {resource.fileType && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-mono uppercase">
                {resource.fileType}
              </span>
            )}

            {/* 카테고리 */}
            {resource.category && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                {resource.category.name}
              </span>
            )}

            {/* 글 내용 있음 표시 */}
            {hasContent && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                글 내용 있음
              </span>
            )}
          </div>

          {resource.description && (
            <p className="text-sm text-gray-500 mt-0.5">{resource.description}</p>
          )}

          <div className="mt-1 flex items-center gap-3">
            <span className="text-xs text-gray-400">{date}</span>
            {hasContent && (
              <button
                type="button"
                onClick={() => setContentOpen((v) => !v)}
                className="text-xs text-[#1B3A6B] hover:underline flex items-center gap-0.5"
              >
                {contentOpen ? '내용 접기 ▲' : '내용 보기 ▼'}
              </button>
            )}
          </div>
        </div>

        {/* 열기 / 잠금 */}
        {accessible ? (
          <a
            href={resource.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1B3A6B] text-white hover:bg-[#142d54] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            열기
          </a>
        ) : (
          <a
            href={
              userAccessLevel === 'none'
                ? '/auth/login'
                : resource.accessLevel === 'PREMIUM'
                  ? '/member/upgrade'
                  : '/auth/login'
            }
            className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors"
          >
            {resource.accessLevel === 'PREMIUM' ? (
              <>
                <LockIcon gold />
                정회원 전용
              </>
            ) : (
              <>
                <LockIcon />
                회원 전용
              </>
            )}
          </a>
        )}

        {/* 수정/삭제 버튼 */}
        {canManage && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(resource)}
                className="p-1.5 rounded-md text-gray-400 hover:text-[#1B3A6B] hover:bg-blue-50 transition-colors"
                title="수정"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 글 내용 펼치기 */}
      {hasContent && contentOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg px-4 py-3 text-sm">
            {resource.content}
          </div>
        </div>
      )}
    </div>
  )
}

export function ResourceList({
  resources,
  userAccessLevel,
  searchable,
  deleteMode,
  currentUserId,
  onEdit,
}: ResourceListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resources
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.category?.name ?? '').toLowerCase().includes(q),
    )
  }, [resources, query])

  const getCanManage = (resource: Resource): boolean => {
    if (!deleteMode) return false
    if (deleteMode === 'all') return true
    return deleteMode === 'own' && !!currentUserId && resource.uploadedById === currentUserId
  }

  return (
    <div>
      {searchable && (
        <div className="py-4 px-2 border-b border-gray-100">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목, 설명, 카테고리로 검색"
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 bg-gray-50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="검색어 지우기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {query && (
            <p className="mt-2 text-xs text-gray-400">
              &ldquo;{query}&rdquo; 검색 결과 {filtered.length}건
            </p>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {query ? (
            <>
              <p className="text-base font-medium">검색 결과가 없습니다</p>
              <p className="text-sm mt-1 text-gray-400">
                &ldquo;{query}&rdquo;에 해당하는 자료를 찾지 못했습니다
              </p>
            </>
          ) : (
            <p className="text-lg">등록된 자료가 없습니다.</p>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              userAccessLevel={userAccessLevel}
              canManage={getCanManage(resource)}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
