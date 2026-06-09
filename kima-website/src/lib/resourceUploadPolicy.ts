export const RESOURCE_UPLOAD_BUCKET = 'forum-files'
export const MAX_RESOURCE_FILE_SIZE_MB = 100

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
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  hwp: 'application/x-hwp',
  hwpx: 'application/vnd.hancom.hwpx',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
}

export const ALLOWED_RESOURCE_EXTENSIONS = new Set(Object.keys(RESOURCE_EXTENSION_TO_TYPE))

export function isAllowedResourceExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return ALLOWED_RESOURCE_EXTENSIONS.has(ext)
}

export function normalizedResourceMimeType(file: { name: string; type: string }): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const inferredType = RESOURCE_EXTENSION_TO_TYPE[extension]
  if (inferredType && (!file.type || file.type === 'application/octet-stream')) return inferredType

  return file.type || 'application/octet-stream'
}
