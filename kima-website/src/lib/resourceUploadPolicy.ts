export const RESOURCE_UPLOAD_BUCKET = 'forum-files'

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
  exe: 'application/octet-stream',
}

export function normalizedResourceMimeType(file: { name: string; type: string }): string {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const inferredType = RESOURCE_EXTENSION_TO_TYPE[extension]
  if (inferredType && (!file.type || file.type === 'application/octet-stream')) return inferredType

  return file.type || 'application/octet-stream'
}
