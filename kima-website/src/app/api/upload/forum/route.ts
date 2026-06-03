import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { safeStorageKey } from '@/lib/utils'
import { convertToWebP, isConvertibleImage } from '@/lib/imageConvert'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role
    if (role !== 'ADMIN' && role !== 'OFFICER') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'misc'

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    let buffer   = Buffer.from(await file.arrayBuffer())
    let mimeType = file.type || 'application/octet-stream'
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
