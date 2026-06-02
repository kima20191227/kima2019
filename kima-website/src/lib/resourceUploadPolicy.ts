export const RESOURCE_UPLOAD_BUCKET = 'forum-files'
export const MAX_RESOURCE_FILE_SIZE_MB = 100
export const MAX_RESOURCE_FILE_SIZE_BYTES = MAX_RESOURCE_FILE_SIZE_MB * 1024 * 1024

const ALLOWED_RESOURCE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
  'application/vnd.hancom.hwpx',
  'video/mp4',
  'video/quicktime',
])

const RESOURCE_EXTENSION_TO_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  hwp: 'application/x-hwp',
  hwpx: 'application/vnd.hancom.hwpx',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
}

export function normalizedResourceMimeType(file: { name: string; type: string }): string | null {
  if (ALLOWED_RESOURCE_TYPES.has(file.type)) return file.type

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const inferredType = RESOURCE_EXTENSION_TO_TYPE[extension]
  if (inferredType && (!file.type || file.type === 'application/octet-stream')) return inferredType

  return null
}
