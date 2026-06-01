import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileToDrive } from '@/lib/googleDrive'
import { cfEnv } from '@/lib/cfEnv'
import { createAdminClient } from '@/lib/supabase'
import { safeStorageKey } from '@/lib/utils'
import { convertToWebP, isConvertibleImage } from '@/lib/imageConvert'

const MAX_FILE_SIZE_MB = 100
const DEFAULT_DRIVE_FOLDER_ID = '0AGil8dGKJPdzUk9PVA'
const FALLBACK_BUCKET = 'forum-files'
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

export const runtime = 'nodejs'

type GoogleServiceAccountKey = {
  client_email?: string
  private_key?: string
}

function parseServiceAccountKey(raw: string | undefined): GoogleServiceAccountKey {
  if (!raw) return {}

  const candidates = [raw.trim()]
  try {
    candidates.push(Buffer.from(raw.trim(), 'base64').toString('utf8'))
  } catch {
    // The value was not base64 encoded.
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as GoogleServiceAccountKey
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      }
    } catch {
      // Try the next representation.
    }
  }

  return {}
}

function normalizedResourceMimeType(file: File): string | null {
  if (ALLOWED_RESOURCE_TYPES.has(file.type)) return file.type

  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const inferredType = RESOURCE_EXTENSION_TO_TYPE[extension]
  if (inferredType && (!file.type || file.type === 'application/octet-stream')) return inferredType

  return null
}

async function uploadFileToSupabaseFallback(file: File, initialMimeType: string): Promise<{ url: string; fileType: string }> {
  let buffer = Buffer.from(await file.arrayBuffer())
  let mimeType = initialMimeType
  let ext = file.name.split('.').pop() ?? 'bin'

  if (isConvertibleImage(mimeType)) {
    const converted = await convertToWebP(buffer, mimeType)
    buffer = converted.buffer
    mimeType = converted.contentType
    ext = converted.ext
  }

  const storedFile = {
    name: file.name.replace(/\.[^.]+$/, `.${ext}`),
    type: mimeType,
  }
  const path = safeStorageKey(storedFile, 'community')
  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from(FALLBACK_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) {
    throw new Error(`Supabase Storage 업로드 실패: ${error.message}`)
  }

  const { data } = supabase.storage.from(FALLBACK_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, fileType: mimeType }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다.` },
        { status: 400 },
      )
    }

    const mimeType = normalizedResourceMimeType(file)
    if (!mimeType) {
      return NextResponse.json(
        { error: '허용되지 않는 파일 형식입니다. 이미지, PDF, 문서, PPT, 텍스트, 영상 파일만 업로드할 수 있습니다.' },
        { status: 400 },
      )
    }

    const serviceAccount = parseServiceAccountKey(cfEnv('GOOGLE_SERVICE_ACCOUNT_KEY'))
    const folderId = cfEnv('GOOGLE_DRIVE_RESOURCE_FOLDER_ID') ?? DEFAULT_DRIVE_FOLDER_ID
    const clientEmail = cfEnv('GOOGLE_CLIENT_EMAIL') ?? serviceAccount.client_email ?? ''
    const privateKey = cfEnv('GOOGLE_PRIVATE_KEY') ?? serviceAccount.private_key ?? ''

    if (!clientEmail || !privateKey) {
      const fallback = await uploadFileToSupabaseFallback(file, mimeType)
      return NextResponse.json({ ...fallback, storage: 'supabase' })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      const driveUrl = await uploadFileToDrive(buffer, file.name, mimeType, {
        folderId,
        clientEmail,
        privateKey,
      })

      return NextResponse.json({ url: driveUrl, fileType: mimeType, storage: 'drive' })
    } catch (driveError) {
      console.error(
        '[upload/resource] Google Drive upload failed; falling back to Supabase Storage.',
        driveError instanceof Error ? driveError.message : driveError,
      )

      const fallback = await uploadFileToSupabaseFallback(file, mimeType)
      return NextResponse.json({ ...fallback, storage: 'supabase' })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload/resource]', msg)
    return NextResponse.json(
      { error: msg || '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
