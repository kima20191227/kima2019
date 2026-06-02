import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cfEnv } from '@/lib/cfEnv'
import { createDriveResumableUploadSession, parseServiceAccountKey } from '@/lib/googleDrive'
import {
  MAX_RESOURCE_FILE_SIZE_BYTES,
  MAX_RESOURCE_FILE_SIZE_MB,
  normalizedResourceMimeType,
} from '@/lib/resourceUploadPolicy'

const DEFAULT_DRIVE_FOLDER_ID = '0AGil8dGKJPdzUk9PVA'

type SignedUploadRequest = {
  name?: unknown
  type?: unknown
  size?: unknown
}

function resolveDriveOptions() {
  const serviceAccount = parseServiceAccountKey(cfEnv('GOOGLE_SERVICE_ACCOUNT_KEY'))
  const folderId = cfEnv('GOOGLE_DRIVE_RESOURCE_FOLDER_ID') ?? DEFAULT_DRIVE_FOLDER_ID
  const clientEmail = cfEnv('GOOGLE_CLIENT_EMAIL') ?? serviceAccount.client_email ?? ''
  const privateKey = cfEnv('GOOGLE_PRIVATE_KEY') ?? serviceAccount.private_key ?? ''

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive 업로드 설정이 없습니다. 서비스 계정 키를 확인해주세요.')
  }

  return { folderId, clientEmail, privateKey }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null) as SignedUploadRequest | null
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim() : ''
    const size = typeof body?.size === 'number' ? body.size : Number(body?.size)

    if (!name || !Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: '업로드할 파일 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    if (size > MAX_RESOURCE_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `파일 크기는 ${MAX_RESOURCE_FILE_SIZE_MB}MB 이하여야 합니다.` },
        { status: 400 },
      )
    }

    const mimeType = normalizedResourceMimeType({ name, type })
    if (!mimeType) {
      return NextResponse.json(
        { error: '허용되지 않는 파일 형식입니다. 이미지, PDF, 문서, PPT, 텍스트, 영상 파일만 업로드할 수 있습니다.' },
        { status: 400 },
      )
    }

    const uploadUrl = await createDriveResumableUploadSession(name, mimeType, resolveDriveOptions())

    return NextResponse.json({
      storage: 'drive',
      uploadUrl,
      fileType: mimeType,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload/resource/signed]', message)
    return NextResponse.json(
      { error: message || 'Google Drive 업로드 세션 발급 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
