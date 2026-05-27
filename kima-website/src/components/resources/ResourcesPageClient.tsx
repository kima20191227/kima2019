'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ResourceList } from './ResourceList'
import type { Resource } from './ResourceList'

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
  categories?: Category[]
  preselectedCategoryId?: string
}

const FILE_TYPES = ['PDF', 'PPT', 'DOCX', 'HWP', 'IMG', 'ETC'] as const

const DEFAULT_ACCESS_LEVEL: Record<ResourceSection, string> = {
  KIMA: 'MEMBER',
  MINISTRY: 'MEMBER',
  PUBLIC: 'PUBLIC',
}

interface FormFields {
  title: string
  description: string
  driveUrl: string
  fileType: string
  accessLevel: string
  categoryId: string
}

function makeInitialFields(
  section: ResourceSection,
  preselectedCategoryId?: string,
  resource?: Resource | null,
): FormFields {
  return {
    title: resource?.title ?? '',
    description: resource?.description ?? '',
    driveUrl: resource?.driveUrl ?? '',
    fileType: resource?.fileType ?? 'PDF',
    accessLevel: resource?.accessLevel ?? DEFAULT_ACCESS_LEVEL[section],
    categoryId: resource?.category?.id ?? preselectedCategoryId ?? '',
  }
}

interface ResourceFormProps {
  section: ResourceSection
  categories?: Category[]
  preselectedCategoryId?: string
  editing?: Resource | null
  onSubmit: (fields: FormFields) => void
  onCancel: () => void
  isPending: boolean
  error: string
}

function ResourceForm({
  section,
  categories,
  preselectedCategoryId,
  editing,
  onSubmit,
  onCancel,
  isPending,
  error,
}: ResourceFormProps) {
  const [fields, setFields] = useState<FormFields>(() =>
    makeInitialFields(section, preselectedCategoryId, editing),
  )
  const set = (k: keyof FormFields, v: string) => setFields((prev) => ({ ...prev, [k]: v }))
  const hasCategories = categories && categories.length > 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
      <h3 className="font-semibold text-gray-800">{editing ? '자료 수정' : '새 자료 등록'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <label className="block text-xs text-gray-500 mb-1">구글 드라이브 URL *</label>
          <input
            type="url"
            value={fields.driveUrl}
            onChange={(e) => set('driveUrl', e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
            disabled={isPending}
          />
        </div>

        <div className="md:col-span-2">
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

        <div
          className={`grid gap-2 md:col-span-2 ${
            hasCategories ? 'grid-cols-3' : 'grid-cols-2'
          }`}
        >
          <div>
            <label className="block text-xs text-gray-500 mb-1">파일 형식</label>
            <select
              value={fields.fileType}
              onChange={(e) => set('fileType', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
              disabled={isPending}
            >
              {FILE_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">접근 등급</label>
            <select
              value={fields.accessLevel}
              onChange={(e) => set('accessLevel', e.target.value)}
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
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(fields)}
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {isPending
            ? editing
              ? '수정 중…'
              : '등록 중…'
            : editing
              ? '수정 완료'
              : '등록'}
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
  categories,
  preselectedCategoryId,
}: ResourcesPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')

  const isFormVisible = formOpen || editingResource !== null

  const closeForm = () => {
    setFormOpen(false)
    setEditingResource(null)
    setFormError('')
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource)
    setFormOpen(false)
    setFormError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = (fields: FormFields) => {
    if (!fields.title.trim() || !fields.driveUrl.trim()) {
      setFormError('제목과 구글 드라이브 URL은 필수입니다.')
      return
    }
    setFormError('')

    startTransition(async () => {
      const isEdit = editingResource !== null
      const url = isEdit ? `/api/resources/${editingResource.id}` : '/api/resources'
      const method = isEdit ? 'PATCH' : 'POST'

      const body: Record<string, unknown> = {
        title: fields.title.trim(),
        driveUrl: fields.driveUrl.trim(),
        fileType: fields.fileType,
        accessLevel: fields.accessLevel,
        ...(fields.description.trim() ? { description: fields.description.trim() } : {}),
        ...(fields.categoryId ? { categoryId: fields.categoryId } : {}),
      }

      if (!isEdit) {
        body.section = section
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

      closeForm()
      router.refresh()
    })
  }

  return (
    <div>
      {/* 자료 등록 버튼 (폼이 닫혀 있을 때) */}
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
          section={section}
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
          resources={resources}
          userAccessLevel={userAccessLevel}
          searchable
          deleteMode={deleteMode}
          currentUserId={currentUserId}
          onEdit={canUpload ? handleEdit : undefined}
        />
      </div>
    </div>
  )
}
