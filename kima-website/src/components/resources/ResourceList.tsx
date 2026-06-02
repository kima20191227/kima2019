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
  thumbnail?: string | null
  driveUrl: string
  fileUrls?: string[]
  fileType: string | null
  accessLevel: AccessLevel
  section?: string | null
  uploadedById?: string | null
  createdAt: string | Date
  category?: { id: string; name: string; slug: string } | null
  sourceType?: 'RESOURCE' | 'SHARE_POST'
  sourceLabel?: string
  sourceHref?: string
  sourceActionLabel?: string
  sourceExternal?: boolean
}

export interface ResourceListProps {
  resources: Resource[]
  userAccessLevel: 'none' | 'member' | 'premium'
  searchable?: boolean
  deleteMode?: 'all' | 'own' | null
  currentUserId?: string
  isAdmin?: boolean
  onEdit?: (resource: Resource) => void
  onDeleted?: (id: string) => void
}

const ACCESS_BADGES: Record<AccessLevel, { label: string; className: string }> = {
  PUBLIC: { label: '공개', className: 'bg-gray-100 text-gray-600' },
  MEMBER: { label: '회원', className: 'bg-blue-100 text-blue-700' },
  PREMIUM: { label: '정회원', className: 'bg-amber-100 text-amber-700' },
}

const SOURCE_BADGES = {
  RESOURCE: { label: '사역 자료', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  SHARE_POST: { label: '사역 나눔', className: 'bg-amber-50 text-amber-700 border-amber-100' },
} as const

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

function FileIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

function getDriveFileId(url: string): string | null {
  // https://drive.google.com/file/d/{id}/view
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/)
  if (m1) return m1[1]
  // https://drive.google.com/open?id={id} or /uc?id={id}
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/)
  if (m2) return m2[1]
  return null
}

function DriveThumbnail({ driveUrl, title }: { driveUrl: string; title: string }) {
  const fileId = getDriveFileId(driveUrl)
  const [failed, setFailed] = useState(false)

  if (!fileId || failed) {
    return (
      <div className="w-12 h-16 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
        <FileIcon />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://drive.google.com/thumbnail?id=${fileId}&sz=w120`}
      alt={title}
      onError={() => setFailed(true)}
      className="w-12 h-16 rounded-md border border-gray-200 object-cover flex-shrink-0"
    />
  )
}

function DrivePreview({ driveUrl, title }: { driveUrl: string; title: string }) {
  const fileId = getDriveFileId(driveUrl)
  if (!fileId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <FileIcon />
        <span className="text-xs">직접 미리보기를 지원하지 않는 파일입니다.</span>
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#1B3A6B] underline hover:text-[#142d54]"
        >
          파일 열기 →
        </a>
      </div>
    )
  }
  return (
    <iframe
      src={`https://drive.google.com/file/d/${fileId}/preview`}
      title={title}
      className="w-full h-full border-0"
      allow="autoplay"
    />
  )
}

function ResourceRow({
  resource,
  userAccessLevel,
  canManage,
  onEdit,
  onDeleted,
}: {
  resource: Resource
  userAccessLevel: 'none' | 'member' | 'premium'
  canManage: boolean
  onEdit?: (resource: Resource) => void
  onDeleted?: (id: string) => void
}) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [contentOpen, setContentOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  const accessible = canAccess(resource.accessLevel, userAccessLevel)
  const badge = ACCESS_BADGES[resource.accessLevel]
  const sourceType = resource.sourceType ?? 'RESOURCE'
  const sourceBadge = SOURCE_BADGES[sourceType]
  const sourceHref = resource.sourceHref ?? resource.driveUrl
  const sourceActionLabel = resource.sourceActionLabel ?? ((resource.fileUrls ?? []).length > 0 ? '파일 1' : '열기')
  const sourceExternal = resource.sourceExternal ?? true
  const date = new Date(resource.createdAt).toLocaleDateString('ko-KR')
  const hasContent = !!resource.content?.trim()
  const hasDriveFile = !!getDriveFileId(resource.driveUrl)

  const isSharePost = resource.sourceType === 'SHARE_POST'

  const handleEdit = () => {
    if (isSharePost && resource.sourceHref) {
      router.push(`${resource.sourceHref}/edit`)
    } else {
      onEdit?.(resource)
    }
  }

  const handleDelete = async () => {
    const label = isSharePost ? '게시글' : '자료'
    if (!confirm(`"${resource.title}" ${label}을 삭제하시겠습니까?`)) return
    setIsDeleting(true)
    try {
      const url = isSharePost
        ? `/api/posts/${resource.id.replace(/^share-/, '')}`
        : `/api/resources/${resource.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        onDeleted?.(resource.id)
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
    <div className={cn('py-3 px-3 sm:px-4 transition-colors', accessible ? 'hover:bg-gray-50/60' : 'opacity-70')}>
      <div className="flex items-start gap-3">

        {/* 썸네일 (고정 크기) */}
        <div className="flex-shrink-0">
          {resource.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getDriveFileId(resource.thumbnail)
                ? `https://drive.google.com/thumbnail?id=${getDriveFileId(resource.thumbnail)}&sz=w120`
                : resource.thumbnail}
              alt={resource.title}
              className="w-14 h-[4.5rem] sm:w-16 sm:h-20 rounded-lg border border-gray-200 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <DriveThumbnail driveUrl={resource.driveUrl} title={resource.title} />
          )}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 min-w-0">

          {/* ① 제목 + 접근 배지 */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1 min-w-0">
              {resource.title}
            </h3>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 flex-shrink-0">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold',
                sourceBadge.className,
              )}>
                {resource.sourceLabel ?? sourceBadge.label}
              </span>
              <span className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium',
                badge.className,
              )}>
                {resource.accessLevel !== 'PUBLIC' && (
                  <LockIcon gold={resource.accessLevel === 'PREMIUM'} />
                )}
                {badge.label}
              </span>
            </div>
          </div>

          {/* ② 설명 */}
          {resource.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{resource.description}</p>
          )}

          {/* ③ 메타 칩: 날짜 · 카테고리 · 파일형식 · 글있음 */}
          <div className="flex items-center flex-wrap gap-1.5 mt-1">
            <span className="text-xs text-gray-400">{date}</span>
            {resource.category && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                {resource.category.name}
              </span>
            )}
            {resource.fileType && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-mono uppercase">
                {resource.fileType}
              </span>
            )}
            {hasContent && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600">
                글 있음
              </span>
            )}
          </div>

          {/* ④ 액션 버튼 행 */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {accessible ? (
              <>
                <a
                  href={sourceHref}
                  target={sourceExternal ? '_blank' : undefined}
                  rel={sourceExternal ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1B3A6B] text-white hover:bg-[#142d54] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {sourceActionLabel}
                </a>
                {(resource.fileUrls ?? []).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    파일 {i + 2}
                  </a>
                ))}
              </>
            ) : (
              <a
                href={userAccessLevel === 'none' ? '/auth/login' : resource.accessLevel === 'PREMIUM' ? '/member/upgrade' : '/auth/login'}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <LockIcon gold={resource.accessLevel === 'PREMIUM'} />
                {resource.accessLevel === 'PREMIUM' ? '정회원 전용' : '로그인 필요'}
              </a>
            )}

            {hasContent && (
              <button
                type="button"
                onClick={() => setContentOpen((v) => !v)}
                className="text-xs text-[#1B3A6B] hover:underline"
              >
                {contentOpen ? '내용 접기 ▲' : '내용 ▼'}
              </button>
            )}
            {sourceType === 'RESOURCE' && hasDriveFile && accessible && (
              <button
                type="button"
                onClick={() => setPreviewOpen((v) => !v)}
                className="text-xs text-[#C8922A] hover:underline font-medium"
              >
                {previewOpen ? '미리보기 닫기 ▲' : '미리보기 ▼'}
              </button>
            )}

            {canManage && (
              <div className="flex items-center gap-0.5 ml-auto">
                {(onEdit || isSharePost) && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="p-1.5 rounded-md text-gray-400 hover:text-[#1B3A6B] hover:bg-blue-50 transition-colors"
                    title="수정"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 글 내용 펼치기 */}
      {hasContent && contentOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg px-4 py-3 text-sm">
            {resource.content}
          </div>
        </div>
      )}

      {/* 미리보기 iframe */}
      {previewOpen && accessible && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-64 sm:h-[480px]">
            <DrivePreview driveUrl={resource.driveUrl} title={resource.title} />
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            미리보기가 표시되지 않으면{' '}
            <a href={resource.driveUrl} target="_blank" rel="noopener noreferrer" className="text-[#1B3A6B] underline">
              직접 열기 →
            </a>
          </p>
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
  isAdmin,
  onEdit,
  onDeleted,
}: ResourceListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return resources
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.content ?? '').toLowerCase().includes(q) ||
        (r.category?.name ?? '').toLowerCase().includes(q) ||
        (r.sourceLabel ?? '').toLowerCase().includes(q),
    )
  }, [resources, query])

  const getCanManage = (resource: Resource): boolean => {
    if (resource.sourceType === 'SHARE_POST') {
      if (!currentUserId) return false
      return isAdmin || resource.uploadedById === currentUserId
    }
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
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
