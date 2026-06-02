'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ThumbnailUpload } from '@/components/ui/ThumbnailUpload'
import { FileAttachmentZone } from '@/components/ui/FileAttachmentZone'
import type { AttachedFile } from '@/components/ui/FileAttachmentZone'
import type { AccessLevel } from '@prisma/client'

type ResourceSection = 'KIMA' | 'MINISTRY' | 'PUBLIC'

interface Category {
  id: string
  name: string
}

export interface ResourceEditData {
  id: string
  title: string
  description: string | null
  content: string | null
  thumbnail: string | null
  driveUrl: string
  fileUrls: string[]
  accessLevel: AccessLevel
  section: ResourceSection
  category?: { id: string; name: string; slug: string } | null
}

interface Props {
  resource: ResourceEditData
  categories: Category[]
  isAdmin: boolean
}

const SECTION_REDIRECT: Record<ResourceSection, string> = {
  KIMA: '/resources/kima',
  MINISTRY: '/resources/ministry',
  PUBLIC: '/resources/public',
}

const SECTION_LABELS: Record<ResourceSection, string> = {
  KIMA: 'KIMA 자료 (총회자료·회의록·공식 문서)',
  MINISTRY: '사역 자료 (지역·언어권·사역대상별)',
  PUBLIC: '공개 자료 (누구나 열람 가능)',
}

export function ResourceEditForm({ resource, categories, isAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fileUploading, setFileUploading] = useState(false)
  const [error, setError] = useState('')

  const [fields, setFields] = useState({
    title: resource.title,
    description: resource.description ?? '',
    content: resource.content ?? '',
    thumbnail: resource.thumbnail as string | null,
    driveUrl: resource.driveUrl,
    fileUrls: resource.fileUrls,
    accessLevel: resource.accessLevel as string,
    categoryId: resource.category?.id ?? '',
    targetSection: resource.section as string,
  })

  const set = <K extends keyof typeof fields>(k: K, v: (typeof fields)[K]) =>
    setFields((prev) => ({ ...prev, [k]: v }))

  const initialFiles: AttachedFile[] = [
    ...(resource.driveUrl
      ? [{ url: resource.driveUrl, name: '기존 파일 1', type: 'application/octet-stream' }]
      : []),
    ...(resource.fileUrls ?? []).map((url, i) => ({
      url,
      name: `기존 파일 ${i + 2}`,
      type: 'application/octet-stream',
    })),
  ]

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

  const sectionChanged = fields.targetSection !== resource.section

  const handleSubmit = () => {
    if (!fields.title.trim() || !fields.driveUrl.trim()) {
      setError('제목과 파일은 필수입니다.')
      return
    }
    setError('')

    startTransition(async () => {
      const body: Record<string, unknown> = {
        title: fields.title.trim(),
        thumbnail: fields.thumbnail ?? null,
        driveUrl: fields.driveUrl.trim(),
        fileUrls: fields.fileUrls,
        accessLevel: fields.accessLevel,
        ...(fields.description.trim() ? { description: fields.description.trim() } : {}),
        content: fields.content.trim() || null,
        ...(fields.categoryId ? { categoryId: fields.categoryId } : {}),
      }

      if (sectionChanged) {
        body.section = fields.targetSection
        if (!fields.categoryId) body.categoryId = null
      }

      const res = await fetch(`/api/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error ?? '수정에 실패했습니다.')
        return
      }

      router.push(SECTION_REDIRECT[fields.targetSection as ResourceSection])
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">

      <ThumbnailUpload
        value={fields.thumbnail}
        onChange={(url) => set('thumbnail', url)}
        label="대표 이미지 (선택)"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={fields.title}
          onChange={(e) => set('title', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <input
          type="text"
          value={fields.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="자료에 대한 간략한 설명 (선택)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">글 내용</label>
        <textarea
          value={fields.content}
          onChange={(e) => set('content', e.target.value)}
          rows={6}
          placeholder="자료에 대한 상세 내용을 입력해주세요 (선택)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 resize-none"
          disabled={isPending}
        />
      </div>

      <FileAttachmentZone
        key={resource.id}
        initialFiles={initialFiles}
        onChange={handleFilesChange}
        label="파일 첨부 * (이미지·PDF·문서 등, 여러 파일 가능)"
      />
      {fields.driveUrl && (
        <p className="text-xs text-green-600 -mt-2">
          ✓ {fields.fileUrls.length + 1}개 파일 준비됨
        </p>
      )}

      {isAdmin && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">자료 위치 (섹션)</label>
          <select
            value={fields.targetSection}
            onChange={(e) => set('targetSection', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            disabled={isPending}
          >
            {(Object.entries(SECTION_LABELS) as [ResourceSection, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          {sectionChanged && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠ 저장 시 자료가 &apos;{SECTION_LABELS[fields.targetSection as ResourceSection]}&apos; 페이지로 이동됩니다.
            </p>
          )}
        </div>
      )}

      <div className={`grid gap-3 ${categories.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">접근 등급</label>
          <select
            value={fields.accessLevel}
            onChange={(e) => set('accessLevel', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
            disabled={isPending}
          >
            <option value="PUBLIC">공개</option>
            <option value="MEMBER">회원</option>
            <option value="PREMIUM">정회원</option>
          </select>
        </div>
        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={fields.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30"
              disabled={isPending}
            >
              <option value="">없음</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
          disabled={isPending}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || fileUploading}
          className="flex-1 px-5 py-2.5 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#142d54] disabled:opacity-50 transition-colors"
        >
          {isPending ? '수정 중…' : fileUploading ? '업로드 중…' : '수정 완료'}
        </button>
      </div>
    </div>
  )
}
