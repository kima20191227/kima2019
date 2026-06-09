// Supabase Edge Function — Google Drive 청크 업로드 프록시
//
// 브라우저→Vercel 경유 시 4.5 MB 바디 제한으로 대용량 파일 업로드 불가.
// 서비스 계정 세션 URL은 브라우저 직접 PUT 시 CORS 차단.
// Edge Function이 중계하여 두 제약을 모두 우회한다.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
}

function isAllowedGoogleUploadUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'www.googleapis.com' &&
      url.pathname.startsWith('/upload/drive/')
    )
  } catch {
    return false
  }
}

function nextStartFromRange(range: string | null, fallback: number): number {
  const match = range?.match(/bytes=0-(\d+)$/)
  if (!match) return fallback
  return Number(match[1]) + 1
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: '허용되지 않는 메서드입니다.' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }

  try {
    const formData = await req.formData()

    const uploadUrl = String(formData.get('uploadUrl') ?? '').trim()
    const fileType = String(formData.get('fileType') ?? 'application/octet-stream').trim()
    const start = Number(formData.get('start'))
    const end = Number(formData.get('end'))
    const total = Number(formData.get('total'))
    const chunk = formData.get('chunk') as File | null

    if (!isAllowedGoogleUploadUrl(uploadUrl)) {
      return new Response(
        JSON.stringify({ error: 'Google Drive 업로드 URL이 올바르지 않습니다.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    if (
      !chunk ||
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      !Number.isFinite(total) ||
      start < 0 ||
      end < start ||
      total <= end ||
      chunk.size !== end - start + 1
    ) {
      return new Response(
        JSON.stringify({ error: '업로드 조각 정보가 올바르지 않습니다.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const googleRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType,
        'Content-Range': `bytes ${start}-${end}/${total}`,
      },
      body: chunk.stream(),
    })

    if (googleRes.status === 308) {
      return new Response(
        JSON.stringify({
          done: false,
          nextStart: nextStartFromRange(googleRes.headers.get('range'), end + 1),
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const text = await googleRes.text()
    let parsed: Record<string, unknown> | null = null
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null
    } catch {
      // JSON 파싱 실패 시 null 유지
    }

    if (!googleRes.ok) {
      const googleMessage = parsed?.error ? JSON.stringify(parsed.error) : text
      return new Response(
        JSON.stringify({ error: `Google Drive 업로드 실패: ${googleMessage || googleRes.statusText}` }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const id = typeof parsed?.id === 'string' ? parsed.id : undefined
    const mimeType = typeof parsed?.mimeType === 'string' ? parsed.mimeType : fileType

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Google Drive 업로드 응답에 파일 ID가 없습니다.' }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ done: true, id, mimeType }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[upload-chunk]', message)
    return new Response(
      JSON.stringify({ error: message || 'Google Drive 파일 조각 업로드 중 오류가 발생했습니다.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }
})
