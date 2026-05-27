import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { safeStorageKey } from '@/lib/utils'
import { convertToWebP, isConvertibleImage } from '@/lib/imageConvert'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime',
]

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (role !== 'ADMIN' && role !== 'OFFICER') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: '서버 환경 변수가 설정되지 않았습니다. (SUPABASE_SERVICE_ROLE_KEY)' },
        { status: 500 }
      )
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'misc'

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: `파일 크기는 ${MAX_MB}MB 이하여야 합니다.` }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '허용되지 않는 파일 형식입니다. (이미지·PDF·PPT·Word·영상만 가능)' }, { status: 400 })
    }

    let buffer   = Buffer.from(await file.arrayBuffer())
    let mimeType = file.type
    let ext      = file.name.split('.').pop() ?? 'bin'

    if (isConvertibleImage(mimeType)) {
      const converted = await convertToWebP(buffer, mimeType)
      buffer   = converted.buffer
      mimeType = converted.contentType
      ext      = converted.ext
    }

    const webpFile = new File([buffer], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: mimeType })
    const path = safeStorageKey(webpFile, folder)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('forum-files')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload/forum] Supabase error:', uploadError)
      return NextResponse.json({ error: '업로드 실패: ' + uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('forum-files')
      .getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[upload/forum]', err)
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
