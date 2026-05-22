import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileToDrive } from '@/lib/googleDrive'

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

async function getDriveEnvVars(): Promise<{ folderId: string; serviceAccountKey: string; diag: string }> {
  let cfFolderId = ''
  let cfServiceAccountKey = ''
  let cfError = ''

  // Try Cloudflare Worker bindings first (production)
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare')
    const { env } = getCloudflareContext()
    const cfEnv = env as Record<string, string | undefined>
    cfFolderId = cfEnv.GOOGLE_DRIVE_RESOURCE_FOLDER_ID ?? ''
    cfServiceAccountKey = cfEnv.GOOGLE_SERVICE_ACCOUNT_KEY ?? ''
  } catch (e) {
    cfError = e instanceof Error ? e.message.slice(0, 80) : String(e).slice(0, 80)
  }

  const folderId = cfFolderId || (process.env.GOOGLE_DRIVE_RESOURCE_FOLDER_ID ?? '')
  const serviceAccountKey = cfServiceAccountKey || (process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? '')
  const diag = `cf_folder=${cfFolderId ? 'Y' : 'N'} cf_key=${cfServiceAccountKey ? 'Y' : 'N'} env_folder=${process.env.GOOGLE_DRIVE_RESOURCE_FOLDER_ID ? 'Y' : 'N'} env_key=${process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'Y' : 'N'}${cfError ? ` err=${cfError}` : ''}`

  return { folderId, serviceAccountKey, diag }
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

    const { folderId, serviceAccountKey, diag } = await getDriveEnvVars()

    if (!folderId) {
      return NextResponse.json({ error: `FOLDER_ID 누락 [${diag}]` }, { status: 500 })
    }
    if (!serviceAccountKey) {
      return NextResponse.json({ error: `SERVICE_ACCOUNT 누락 [${diag}]` }, { status: 500 })
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
