import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { safeStorageKey } from '@/lib/utils'
import {
  MAX_RESOURCE_FILE_SIZE_BYTES,
  MAX_RESOURCE_FILE_SIZE_MB,
  RESOURCE_UPLOAD_BUCKET,
  normalizedResourceMimeType,
} from '@/lib/resourceUploadPolicy'

type SignedUploadRequest = {
  name?: unknown
  type?: unknown
  size?: unknown
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

    const supabase = createAdminClient()
    const path = safeStorageKey({ name, type: mimeType }, 'community')
    const { data, error } = await supabase.storage
      .from(RESOURCE_UPLOAD_BUCKET)
      .createSignedUploadUrl(path, { upsert: false })

    if (error || !data) {
      throw new Error(error?.message ?? 'Signed upload URL 발급에 실패했습니다.')
    }

    const { data: publicData } = supabase.storage.from(RESOURCE_UPLOAD_BUCKET).getPublicUrl(path)

    return NextResponse.json({
      bucket: RESOURCE_UPLOAD_BUCKET,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      url: publicData.publicUrl,
      fileType: mimeType,
      storage: 'supabase',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload/resource/signed]', message)
    return NextResponse.json(
      { error: message || '업로드 URL 발급 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
