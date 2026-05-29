import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileToDrive } from '@/lib/googleDrive'
import { cfEnv } from '@/lib/cfEnv'

const MAX_FILE_SIZE_MB = 100
const DEFAULT_DRIVE_FOLDER_ID = '0AGil8dGKJPdzUk9PVA'

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
        { status: 400 }
      )
    }

    const serviceAccount = parseServiceAccountKey(cfEnv('GOOGLE_SERVICE_ACCOUNT_KEY'))
    const folderId = cfEnv('GOOGLE_DRIVE_RESOURCE_FOLDER_ID') ?? DEFAULT_DRIVE_FOLDER_ID
    const clientEmail = cfEnv('GOOGLE_CLIENT_EMAIL') ?? serviceAccount.client_email ?? ''
    const privateKey  = cfEnv('GOOGLE_PRIVATE_KEY') ?? serviceAccount.private_key ?? ''

    if (!clientEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Google 서비스 계정 설정이 필요합니다. (GOOGLE_SERVICE_ACCOUNT_KEY 또는 GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)' },
        { status: 500 }
      )
    }

    const mimeType = file.type || 'application/octet-stream'
    const buffer = Buffer.from(await file.arrayBuffer())
    const driveUrl = await uploadFileToDrive(buffer, file.name, mimeType, {
      folderId,
      clientEmail,
      privateKey,
    })

    return NextResponse.json({ url: driveUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload/resource]', msg)
    return NextResponse.json(
      { error: msg || '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
