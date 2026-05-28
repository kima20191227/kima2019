import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    if (digits.startsWith('02')) {
      return `02-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

export function isPremiumActive(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false
  return expiresAt > new Date()
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'video/mp4':  'mp4',
  'video/quicktime': 'mov',
}

/**
 * Google Drive 공유 링크를 <img>에서 바로 표시 가능한 고해상도 thumbnail URL로 변환.
 * - /file/d/{ID}/view  →  thumbnail?id={ID}&sz=w4096
 * - /file/d/{ID}/preview  →  thumbnail?id={ID}&sz=w4096
 * - open?id={ID}  →  thumbnail?id={ID}&sz=w4096
 * - thumbnail?id={ID}&sz=...  →  thumbnail?id={ID}&sz=w4096 (크기 업그레이드)
 * 이미 변환된 URL 또는 다른 호스트 URL은 그대로 반환.
 */
export function convertDriveUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed

  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w4096`
  }
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) {
    return `https://drive.google.com/thumbnail?id=${openMatch[1]}&sz=w4096`
  }
  const thumbnailMatch = trimmed.match(/drive\.google\.com\/thumbnail\?id=([^&]+?)(?:&|$)/)
  if (thumbnailMatch) {
    return `https://drive.google.com/thumbnail?id=${thumbnailMatch[1]}&sz=w4096`
  }
  return trimmed
}

/** 줄바꿈으로 구분된 여러 URL을 각각 convertDriveUrl 처리 후 반환 */
export function convertDriveUrls(text: string): string {
  return text
    .split('\n')
    .map((line) => convertDriveUrl(line))
    .join('\n')
}

export function safeStorageKey(file: { name: string; type: string }, folder: string): string {
  const ext = MIME_TO_EXT[file.type]
    ?? file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toLowerCase()
    ?? 'bin'
  const base = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 60)
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}.${ext}`
}
