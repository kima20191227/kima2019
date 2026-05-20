import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { safeStorageKey } from '@/lib/utils'
import { convertToWebP, isConvertibleImage } from '@/lib/imageConvert'

const BUCKET = 'kima-media'
const MAX_FILES = 20
const MAX_FILE_SIZE_MB = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']

function isOfficer(role?: string) {
  return role === 'ADMIN' || role === 'OFFICER'
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!isOfficer(session?.user?.role)) {
      return NextResponse.json({ error: '임원 이상만 파일을 업로드할 수 있습니다.' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: '서버 환경 변수가 설정되지 않았습니다. (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files.length) {
      return NextResponse.json({ error: '업로드할 파일이 없습니다.' }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `한 번에 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.` },
        { status: 400 }
      )
    }

    const oversized = files.find((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    if (oversized) {
      return NextResponse.json(
        { error: `파일 크기는 ${MAX_FILE_SIZE_MB}MB 이하여야 합니다. (${oversized.name})` },
        { status: 400 }
      )
    }

    const invalidType = files.find((f) => !ALLOWED_TYPES.includes(f.type))
    if (invalidType) {
      return NextResponse.json(
        { error: 'JPG, PNG, WebP, GIF, HEIC 이미지 파일만 업로드 가능합니다.' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const urls: string[] = []

    for (const file of files) {
      let bytes    = Buffer.from(await file.arrayBuffer())
      let mimeType = file.type
      let ext      = file.name.split('.').pop() ?? 'bin'

      if (isConvertibleImage(mimeType)) {
        const converted = await convertToWebP(bytes, mimeType)
        bytes    = converted.buffer
        mimeType = converted.contentType
        ext      = converted.ext
      }

      const webpFile = new File([bytes], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: mimeType })
      const filename = safeStorageKey(webpFile, 'events')

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filename, bytes, { contentType: mimeType, upsert: false })

      if (error) {
        return NextResponse.json(
          { error: `파일 업로드에 실패했습니다: ${error.message}` },
          { status: 500 }
        )
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
      urls.push(data.publicUrl)
    }

    return NextResponse.json({ urls })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: '업로드 중 오류가 발생했습니다.', detail: msg },
      { status: 500 }
    )
  }
}
