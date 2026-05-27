import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadFileToDrive } from '@/lib/googleDrive'

const KNOWN_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPT',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOC',
}

const EXTENSION_TYPES: Record<string, string> = {
  pdf: 'PDF',
  ppt: 'PPT',
  pptx: 'PPT',
  doc: 'DOC',
  docx: 'DOC',
}

const MAX_FILE_SIZE_MB = 50
const DRIVE_FOLDER_ID = '0AGil8dGKJPdzUk9PVA'

function getFileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? ''
}

function getKnownFileType(file: File): string | undefined {
  return KNOWN_TYPES[file.type] ?? EXTENSION_TYPES[getFileExtension(file.name)]
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

    const fileType = getKnownFileType(file)
    if (!fileType) {
      return NextResponse.json(
        { error: 'PDF, PPT, DOC 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      )
    }

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL ?? ''
    const privateKey  = process.env.GOOGLE_PRIVATE_KEY ?? ''

    if (!clientEmail || !privateKey) {
      return NextResponse.json(
        { error: 'Google 서비스 계정 설정이 필요합니다. (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)' },
        { status: 500 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const driveUrl = await uploadFileToDrive(buffer, file.name, file.type, {
      folderId: DRIVE_FOLDER_ID,
      clientEmail,
      privateKey,
    })

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
