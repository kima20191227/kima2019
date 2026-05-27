import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { safeStorageKey } from '@/lib/utils'
import { convertToWebP } from '@/lib/imageConvert'

const BUCKET = 'popups'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'JPG, PNG, WebP, GIF 파일만 업로드 가능합니다.' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const converted = await convertToWebP(Buffer.from(await file.arrayBuffer()), file.type)
    const webpFile  = new File([converted.buffer], file.name.replace(/\.[^.]+$/, '.webp'), { type: converted.contentType })
    const filename  = safeStorageKey(webpFile, '')

    const { error } = await adminClient.storage.from(BUCKET).upload(filename, converted.buffer, {
      contentType: converted.contentType,
      upsert: false,
    })
    if (error) {
      return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = adminClient.storage.from(BUCKET).getPublicUrl(filename)
    return NextResponse.json({ url: publicUrl })
  } catch {
    return NextResponse.json({ error: '업로드 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
