import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileToDrive } from '@/lib/googleDrive'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const MAX_FILE_SIZE_MB = 50
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLS',
}

const DRIVE_FOLDER_ID = '1LKzxRWypSnhbZzkGTDhWvhHG7a07r1RF'

function getServiceAccountKey(): string {
  // Static import of getCloudflareContext lets OpenNext patch it at build time
  // so it works correctly inside the Cloudflare Workers runtime.
  try {
    const { env } = getCloudflareContext()
    const key = (env as Record<string, string | undefined>).GOOGLE_SERVICE_ACCOUNT_KEY
    if (key) return key
  } catch {
    // local dev — fall through
  }
  return process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? ''
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

    const fileType = ALLOWED_TYPES[file.type]
    if (!fileType) {
      return NextResponse.json(
        { error: 'PDF, PPT, DOC, XLS 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    const folderId = DRIVE_FOLDER_ID
    const serviceAccountKey = getServiceAccountKey()

    if (!serviceAccountKey) {
      return NextResponse.json({ error: 'Google 서비스 계정 키가 설정되지 않았습니다. (GOOGLE_SERVICE_ACCOUNT_KEY)' }, { status: 500 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const driveUrl = await uploadFileToDrive(buffer, file.name, file.type, { folderId, serviceAccountKey })

    return NextResponse.json({ url: driveUrl, fileType })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[upload/resource]', msg)
    return NextResponse.json(
      { error: msg || '파일 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
