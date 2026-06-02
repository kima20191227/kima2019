'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResourceList } from './ResourceList'
import type { Resource } from './ResourceList'
import { ThumbnailUpload } from '@/components/ui/ThumbnailUpload'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'

type ResourceSection = 'KIMA' | 'MINISTRY' | 'PUBLIC'

interface Category {
  id: string
  name: string
}

export interface ResourcesPageClientProps {
  resources: Resource[]
  section: ResourceSection
  userAccessLevel: 'none' | 'member' | 'premium'
  canUpload: boolean
  deleteMode: 'all' | 'own' | null
  currentUserId?: string
  isAdmin?: boolean
  categories?: Category[]
  preselectedCategoryId?: string
}

const DEFAULT_ACCESS_LEVEL: Record<ResourceSection, string> = {
  KIMA: 'MEMBER',
  MINISTRY: 'MEMBER',
  PUBLIC: 'PUBLIC',
}

const SECTION_LABELS: Record<ResourceSection, string> = {
  KIMA: 'KIMA 자료',
  MINISTRY: '사역 자료',
  PUBLIC: '공개 자료',
}

const SECTION_REDIRECT: Record<ResourceSection, string> = {
  KIMA: '/resources/kima',
  MINISTRY: '/resources/ministry',
  PUBLIC: '/resources/public',
}

interface FormFields {
  title: string
  description: string
  content: string
  thumbnail: string | null
  driveUrl: string
  fileUrls: string[]
  accessLevel: string
  categoryId: string
  targetSection: ResourceSection
}

function makeInitialFields(
  pageSection: ResourceSection,
  preselectedCategoryId?: string,
  resource?: Resource | null,
): FormFields {
  return {
    title: resource?.title ?? '',
    description: resource?.description ?? '',
    content: resource?.content ?? '',
    thumbnail: resource?.thumbnail ?? null,
    driveUrl: resource?.driveUrl ?? '',
    fileUrls: resource?.fileUrls ?? [],
    accessLevel: resource?.accessLevel ?? DEFAULT_ACCESS_LEVEL[pageSection],
    categoryId: resource?.category?.id ?? preselectedCategoryId ?? '',
    targetSection: (resource?.section as ResourceSection) ?? pageSection,
  }
}

interface ResourceFormProps {
  pageSection: ResourceSection
  categories?: Category[]
  preselectedCategoryId?: string
  editing?: Resource | null
  onSubmit: (fields: FormFields) => void
  onCancel: () => void
  isPending: boolean
  error: string
}

function ResourceForm({
  pageSection,
  categories,
  preselectedCategoryId,
  editing,
  onSubmit,
  onCancel,
  isPending,
  error,
}: ResourceFormProps) {
  const [fields, setFields] = useState<FormFields>(() =>
    makeInitialFields(pageSection, preselectedCategoryId, editing),
  )
  const [fileUploading, setFileUploading] = useState(false)

  const set = <K extends keyof FormFields>(k: K, v: FormFields[K]) =>
    setFields((prev) => ({ ...prev, [k]: v }))

  const hasCategories = categories && categories.length > 0
  const originalSection = (editing?.section as ResourceSection) ?? pageSection
  const sectionChanged = editing && fields.targetSection !== originalSection

  // 파일 첨부 변경 핸들러: 첫 파일 → driveUrl, 나머지 → fileUrls
  const handleFilesChange = (files: AttachedFile[], isUploading: boolean) => {
    setFileUploading(isUploading)
    if (files.length === 0) {
      setFields((prev) => ({ ...prev, driveUrl: '', fileUrls: [] }))
      return
    }
    const [first, ...rest] = files
    setFields((prev) => ({
      ...prev,
      driveUrl: first.url,
      fileUrls: rest.map((f) => f.url),
      title: prev.title || first.name.replace(/\.[^.]+$/, ''),
    }))
  }

  // 수정 모드: 기존 파일들을 AttachedFile 형태로 변환
  const initialFiles: AttachedFile[] = editing
    ? [
        ...(editing.driveUrl ? [{ url: editing.driveUrl, name: '기존 파일 1', type: 'application/octet-stream' }] : []),
        ...(editing.fileUrls ?? []).map((url, i) => ({
          url,
          name: `기존 파일 ${i + 2}`,
          type: 'application/octet-stream',
        })),
      ]
    : []

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
      <h3 className="font-semibold text-gray-800">{editing ? '자료 수정' : '새 자료 등록'}</h3>

      {/* 썸네일 */}
      <ThumbnailUpload
        value={fields.thumbnail}
        onChange={(url) => set('thumbnail', url)}
        label="대표 이미지 (선택)"
      />

      {/* 제목 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">제목 *</label>
        <input
          type="text"
          value={fields.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="자료 제목"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          disabled={isPending}
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">설명</label>
        <input
          type="text"
          value={fields.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="자료에 대한 간략한 설명 (선택)"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
          disabled={isPending}
        />
      </div>

      {/* 글 내용 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">글 내용</label>
        <textarea
          value={fields.content}
          onChange={(e) => set('content', e.target.value)}
          rows={6}
          placeholder="자료에 대한 상세 내용을 입력해주세요 (선택)"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B] resize-none"
          disabled={isPending}
        />
      </div>

      {/* 파일 첨부 (다중) */}
      <FileAttachmentZone
        key={editing?.id ?? 'new'}
        initialFiles={initialFiles}
        onChange={handleFilesChange}
        label="파일 첨부 * (이미지·PDF·문서 등, 여러 파일 가능)"
      />
      {fields.driveUrl && (
        <p className="text-xs text-green-600 -mt-2">✓ {fields.fileUrls.length + 1}개 파일 준비됨</p>
      )}

      {/* 자료 위치 (수정 모드에서만 표시) */}
      {editing && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">자료 위치 (섹션)</label>
          <select
            value={fields.targetSection}
            onChange={(e) => set('targetSection', e.target.value as ResourceSection)}
            aria-label="자료 위치 선택"
            title="자료 위치 선택"
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          >
            <option value="KIMA">KIMA 자료 (총회자료·회의록·공식 문서)</option>
            <option value="MINISTRY">사역 자료 (지역·언어권·사역대상별)</option>
            <option value="PUBLIC">공개 자료 (누구나 열람 가능)</option>
          </select>
          {sectionChanged && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠ 저장 시 자료가{' '}
              <strong>&apos;{SECTION_LABELS[fields.targetSection]}&apos;</strong> 페이지로
              이동됩니다.
            </p>
          )}
        </div>
      )}

      {/* 접근 등급 + 카테고리 */}
      <div className={`grid gap-2 ${hasCategories ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <label className="block text-xs text-gray-500 mb-1">접근 등급</label>
          <select
            value={fields.accessLevel}
            onChange={(e) => set('accessLevel', e.target.value)}
            aria-label="접근 등급 선택"
            title="접근 등급 선택"
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          >
            <option value="PUBLIC">공개</option>
            <option value="MEMBER">회원</option>
            <option value="PREMIUM">정회원</option>
          </select>
        </div>

        {hasCategories && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">카테고리</label>
            <select
              value={fields.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              aria-label="카테고리 선택"
              title="카테고리 선택"
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              disabled={isPending}
            >
              <option value="">없음</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(fields)}
          disabled={isPending || fileUploading}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {isPending
            ? editing ? '수정 중…' : '등록 중…'
            : fileUploading
              ? '업로드 중…'
              : editing ? '수정 완료' : '등록'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}

export function ResourcesPageClient({
  resources,
  section,
  userAccessLevel,
  canUpload,
  deleteMode,
  currentUserId,
  isAdmin,
  categories,
  preselectedCategoryId,
}: ResourcesPageClientProps) {
  const router = useRouter()
  const [localResources, setLocalResources] = useState<Resource[]>(resources)
  const [formOpen, setFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')

  // 서버 데이터가 갱신되면(router.refresh 완료) 로컬 상태도 동기화
  useEffect(() => {
    setLocalResources(resources)
  }, [resources])

  const isFormVisible = formOpen || editingResource !== null

  const closeForm = () => {
    setFormOpen(false)
    setEditingResource(null)
    setFormError('')
  }

  const handleEdit = (resource: Resource) => {
    router.push(`/resources/${resource.id}/edit`)
  }

  const handleDeleted = (id: string) => {
    setLocalResources((prev) => prev.filter((r) => r.id !== id))
  }

  const handleSubmit = (fields: FormFields) => {
    if (!fields.title.trim() || !fields.driveUrl.trim()) {
      setFormError('제목과 파일은 필수입니다. 파일을 업로드하거나 URL을 입력해주세요.')
      return
    }
    setFormError('')

    startTransition(async () => {
      const isEdit = editingResource !== null
      const url = isEdit ? `/api/resources/${editingResource.id}` : '/api/resources'
      const method = isEdit ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        title: fields.title.trim(),
        thumbnail: fields.thumbnail ?? null,
        driveUrl: fields.driveUrl.trim(),
        fileUrls: fields.fileUrls,
        accessLevel: fields.accessLevel,
        ...(fields.description.trim() ? { description: fields.description.trim() } : {}),
        ...(fields.content.trim() ? { content: fields.content.trim() } : { content: null }),
        ...(fields.categoryId ? { categoryId: fields.categoryId } : {}),
      }

      if (!isEdit) {
        body.section = section
      } else {
        const originalSection = (editingResource.section as ResourceSection) ?? section
        if (fields.targetSection !== originalSection) {
          body.section = fields.targetSection
          if (!fields.categoryId) body.categoryId = null
        }
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setFormError((json as { error?: string }).error ?? '처리에 실패했습니다.')
        return
      }

      const json = await res.json()
      const saved = (json as { resource: Resource }).resource

      // 서버 응답 즉시 로컬 상태 반영 (화면 즉시 갱신)
      if (isEdit) {
        setLocalResources((prev) =>
          prev.map((r) => (r.id === saved.id ? saved : r)),
        )
      } else {
        setLocalResources((prev) => [saved, ...prev])
      }

      closeForm()

      // 섹션 이동 시 해당 페이지로 리다이렉트
      if (isEdit) {
        const originalSection = (editingResource.section as ResourceSection) ?? section
        if (fields.targetSection !== originalSection) {
          router.push(SECTION_REDIRECT[fields.targetSection])
          return
        }
      }

      // 백그라운드에서 서버 데이터 동기화
      router.refresh()
    })
  }

  return (
    <div>
      {/* 자료 등록 버튼 */}
      {canUpload && !isFormVisible && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#15305a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            자료 등록
          </button>
        </div>
      )}

      {/* 등록 / 수정 폼 */}
      {isFormVisible && (
        <ResourceForm
          key={editingResource?.id ?? 'new'}
          pageSection={section}
          categories={categories}
          preselectedCategoryId={preselectedCategoryId}
          editing={editingResource}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          isPending={isPending}
          error={formError}
        />
      )}

      {/* 자료 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4">
        <ResourceList
          resources={localResources}
          userAccessLevel={userAccessLevel}
          searchable
          deleteMode={deleteMode}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={canUpload ? handleEdit : undefined}
          onDeleted={handleDeleted}
        />
      </div>
    </div>
  )
}
