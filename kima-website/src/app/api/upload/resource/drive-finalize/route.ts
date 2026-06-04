import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cfEnv } from '@/lib/cfEnv'
import { makeDriveFilePublic, parseServiceAccountKey } from '@/lib/googleDrive'

const DEFAULT_DRIVE_FOLDER_ID = '0AGil8dGKJPdzUk9PVA'

type FinalizeRequest = {
  fileId?: unknown
  fileType?: unknown
}

function resolveDriveOptions() {
  const serviceAccount = parseServiceAccountKey(cfEnv('GOOGLE_SERVICE_ACCOUNT_KEY'))
  const folderId = cfEnv('GOOGLE_DRIVE_RESOURCE_FOLDER_ID') ?? DEFAULT_DRIVE_FOLDER_ID
  const clientEmail = cfEnv('GOOGLE_CLIENT_EMAIL') ?? serviceAccount.client_email ?? ''
  const privateKey = cfEnv('GOOGLE_PRIVATE_KEY') ?? serviceAccount.private_key ?? ''

  if (!clientEmail || !privateKey) {
    throw new Error('Google Drive 업로드 설정이 없습니다. 서비스 계정 키를 확인해주세요.')
  }

  return { folderId, fallbackFolderId: DEFAULT_DRIVE_FOLDER_ID, clientEmail, privateKey }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'OFFICER') {
      return NextResponse.json({ error: '임원 이상만 자료를 업로드할 수 있습니다.' }, { status: 403 })
    }

    const body = await request.json().catch(() => null) as FinalizeRequest | null
    const fileId = typeof body?.fileId === 'string' ? body.fileId.trim() : ''
    const fileType = typeof body?.fileType === 'string' ? body.fileType : undefined

    if (!/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
      return NextResponse.json({ error: 'Google Drive 파일 ID가 올바르지 않습니다.' }, { status: 400 })
    }

    const url = await makeDriveFilePublic(fileId, resolveDriveOptions())

    return NextResponse.json({
      url,
      fileType,
      storage: 'drive',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload/resource/drive-finalize]', message)
    return NextResponse.json(
      { error: message || 'Google Drive 파일 공유 설정 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
