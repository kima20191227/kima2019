import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { convertToWebP, isConvertibleImage } from '@/lib/imageConvert'

const BUCKET = 'org-images'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function whereClause(id: string) {
  const numeric = parseInt(id, 10)
  return !isNaN(numeric) ? { gmfsnsId: numeric } : { id }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { id } = await params

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
  }

  if (!isConvertibleImage(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, WEBP, GIF만 업로드 가능합니다.' }, { status: 400 })
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const { buffer, ext } = await convertToWebP(rawBuffer, file.type)

  // Determine storage filename — use numeric id if available
  const storageId = parseInt(id, 10)
  const fileKey = !isNaN(storageId) ? String(storageId) : id
  const filePath = `orgs/${fileKey}.${ext}`

  const supabase = getServiceClient()

  // Remove old files for this org
  await supabase.storage.from(BUCKET).remove([
    `orgs/${fileKey}.jpg`, `orgs/${fileKey}.jpeg`,
    `orgs/${fileKey}.png`, `orgs/${fileKey}.webp`, `orgs/${fileKey}.gif`,
  ])

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: 'image/webp', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: '업로드에 실패했습니다.', detail: uploadError.message }, { status: 500 })
  }

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  const imageUrl = publicData.publicUrl

  // Save image URL to Prisma
  try {
    await prisma.organization.update({
      where: whereClause(id),
      data: { image: imageUrl },
    })
  } catch {
    return NextResponse.json({ error: 'DB 저장 실패' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, imageUrl })
}
