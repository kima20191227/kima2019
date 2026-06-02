import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const runtime = 'nodejs'

function parseNumber(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string') return Number.NaN
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function isAllowedGoogleUploadUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:'
      && url.hostname === 'www.googleapis.com'
      && url.pathname.startsWith('/upload/drive/')
  } catch {
    return false
  }
}

function nextStartFromRange(range: string | null, fallback: number): number {
  const match = range?.match(/bytes=0-(\d+)$/)
  if (!match) return fallback
  return Number(match[1]) + 1
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const uploadUrl = typeof formData.get('uploadUrl') === 'string'
      ? (formData.get('uploadUrl') as string).trim()
      : ''
    const fileType = typeof formData.get('fileType') === 'string'
      ? (formData.get('fileType') as string).trim()
      : 'application/octet-stream'
    const start = parseNumber(formData.get('start'))
    const end = parseNumber(formData.get('end'))
    const total = parseNumber(formData.get('total'))
    const chunk = formData.get('chunk') as File | null

    if (!isAllowedGoogleUploadUrl(uploadUrl)) {
      return NextResponse.json({ error: 'Google Drive 업로드 URL이 올바르지 않습니다.' }, { status: 400 })
    }

    if (!chunk || !Number.isInteger(start) || !Number.isInteger(end) || !Number.isInteger(total)
      || start < 0 || end < start || total <= end || chunk.size !== end - start + 1) {
      return NextResponse.json({ error: '업로드 조각 정보가 올바르지 않습니다.' }, { status: 400 })
    }

    const googleRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType || 'application/octet-stream',
        'Content-Range': `bytes ${start}-${end}/${total}`,
      },
      body: Buffer.from(await chunk.arrayBuffer()),
    })

    if (googleRes.status === 308) {
      return NextResponse.json({
        done: false,
        nextStart: nextStartFromRange(googleRes.headers.get('range'), end + 1),
      })
    }

    const text = await googleRes.text()
    let parsed: unknown = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = null
    }

    if (!googleRes.ok) {
      const googleMessage = parsed && typeof parsed === 'object' && 'error' in parsed
        ? JSON.stringify((parsed as { error: unknown }).error)
        : text
      return NextResponse.json(
        { error: `Google Drive 업로드 실패: ${googleMessage || googleRes.statusText}` },
        { status: 502 },
      )
    }

    const id = parsed && typeof parsed === 'object' && 'id' in parsed
      ? (parsed as { id?: unknown }).id
      : undefined
    const mimeType = parsed && typeof parsed === 'object' && 'mimeType' in parsed
      ? (parsed as { mimeType?: unknown }).mimeType
      : undefined

    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Google Drive 업로드 응답에 파일 ID가 없습니다.' }, { status: 502 })
    }

    return NextResponse.json({
      done: true,
      id,
      mimeType: typeof mimeType === 'string' ? mimeType : fileType,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload/resource/chunk]', message)
    return NextResponse.json(
      { error: message || 'Google Drive 파일 조각 업로드 중 오류가 발생했습니다.' },
      { status: 500 },
    )
  }
}
