'use client'

import { MAX_RESOURCE_FILE_SIZE_BYTES } from '@/lib/resourceUploadPolicy'

const MAX_BROWSER_UPLOAD_BYTES = MAX_RESOURCE_FILE_SIZE_BYTES
const TARGET_IMAGE_BYTES = 3.5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1920

export type UploadResourceResult = {
  url: string
  fileType?: string
  storage?: 'drive' | 'supabase'
}

type SignedUploadResult = {
  uploadUrl: string
  fileType: string
  storage: 'drive'
}

type DriveUploadResponse = {
  id?: string
  mimeType?: string
}

function isCompressibleImage(file: File): boolean {
  return file.type.startsWith('image/')
    && file.type !== 'image/gif'
    && file.type !== 'image/svg+xml'
}

function fileWithExtension(file: File, extension: string, mimeType: string): string {
  const base = file.name.replace(/\.[^.]+$/, '')
  return `${base || 'upload'}.${extension}`
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 브라우저에서 읽을 수 없습니다. JPG, PNG, WebP 파일로 다시 시도해주세요.'))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('이미지 압축에 실패했습니다.'))
    }, mimeType, quality)
  })
}

async function compressImageForUpload(file: File): Promise<File> {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('이미지 압축을 지원하지 않는 브라우저입니다.')
  context.drawImage(image, 0, 0, width, height)

  const mimeCandidates = ['image/webp', 'image/jpeg']
  const qualities = [0.82, 0.72, 0.62, 0.52, 0.42]
  let best: Blob | null = null

  for (const mimeType of mimeCandidates) {
    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, mimeType, quality)
      if (!best || blob.size < best.size) best = blob
      if (blob.size <= TARGET_IMAGE_BYTES) {
        const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
        return new File([blob], fileWithExtension(file, extension, blob.type), { type: blob.type })
      }
    }
  }

  if (best && best.size < file.size && best.size <= MAX_BROWSER_UPLOAD_BYTES) {
    const extension = best.type === 'image/webp' ? 'webp' : 'jpg'
    return new File([best], fileWithExtension(file, extension, best.type), { type: best.type })
  }

  if (file.size <= MAX_BROWSER_UPLOAD_BYTES) return file

  throw new Error('이미지 용량이 너무 큽니다. 100MB 이하 이미지로 줄인 뒤 다시 업로드해주세요.')
}

async function prepareFileForBrowserUpload(file: File): Promise<File> {
  if (isCompressibleImage(file)) {
    if (file.size <= TARGET_IMAGE_BYTES) return file
    return compressImageForUpload(file)
  }

  if (file.size > MAX_BROWSER_UPLOAD_BYTES) {
    throw new Error('파일 용량이 너무 큽니다. 현재 첨부 업로드는 100MB 이하 파일만 가능합니다.')
  }

  return file
}

function errorFromUploadResponse(response: Response, text: string, parsed: unknown): string {
  if (response.status === 413) {
    return '파일 용량이 너무 큽니다. 100MB 이하 파일로 줄인 뒤 다시 업로드해주세요.'
  }

  if (parsed && typeof parsed === 'object' && 'error' in parsed) {
    const error = (parsed as { error?: unknown }).error
    if (typeof error === 'string' && error.trim()) return error
  }

  const stripped = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (stripped) return stripped.slice(0, 220)

  return `업로드에 실패했습니다. (HTTP ${response.status})`
}

async function readUploadResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }

  if (!response.ok) {
    throw new Error(errorFromUploadResponse(response, text, parsed))
  }

  return parsed
}

async function requestSignedUpload(file: File): Promise<SignedUploadResult> {
  const response = await fetch('/api/upload/resource/signed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
    }),
  })
  const parsed = await readUploadResponse(response)

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('uploadUrl' in parsed) ||
    typeof parsed.uploadUrl !== 'string' ||
    !('fileType' in parsed) ||
    typeof parsed.fileType !== 'string'
  ) {
    throw new Error('Google Drive 업로드 세션 응답이 올바르지 않습니다.')
  }

  return parsed as SignedUploadResult
}

async function uploadToDriveSession(file: File, signed: SignedUploadResult): Promise<DriveUploadResponse> {
  const response = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': signed.fileType },
    body: file,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(errorFromUploadResponse(response, text, null))
  }

  const text = await response.text()
  try {
    return text ? JSON.parse(text) as DriveUploadResponse : {}
  } catch {
    return {}
  }
}

async function finalizeDriveUpload(fileId: string, fileType: string): Promise<UploadResourceResult> {
  const response = await fetch('/api/upload/resource/drive-finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, fileType }),
  })
  const parsed = await readUploadResponse(response)

  if (!parsed || typeof parsed !== 'object' || !('url' in parsed) || typeof parsed.url !== 'string') {
    throw new Error('Google Drive 파일 링크 응답이 올바르지 않습니다.')
  }

  return parsed as UploadResourceResult
}

async function uploadThroughServerFallback(file: File): Promise<UploadResourceResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload/resource', {
    method: 'POST',
    body: formData,
  })
  const parsed = await readUploadResponse(response)

  if (!parsed || typeof parsed !== 'object' || !('url' in parsed) || typeof parsed.url !== 'string') {
    throw new Error('파일 업로드 응답이 올바르지 않습니다.')
  }

  return parsed as UploadResourceResult
}

export async function uploadResourceFile(file: File): Promise<UploadResourceResult> {
  const preparedFile = await prepareFileForBrowserUpload(file)

  try {
    const signed = await requestSignedUpload(preparedFile)
    const uploaded = await uploadToDriveSession(preparedFile, signed)
    if (!uploaded.id) {
      throw new Error('Google Drive 업로드 응답에 파일 ID가 없습니다.')
    }
    return finalizeDriveUpload(uploaded.id, uploaded.mimeType ?? signed.fileType)
  } catch {
    return uploadThroughServerFallback(preparedFile)
  }
}
