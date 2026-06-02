import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/upload/resource/chunk/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

function makeRequest(fields: {
  uploadUrl?: string
  fileType?: string
  start?: number
  end?: number
  total?: number
  chunk?: File
}): Request {
  const formData = new FormData()
  if (fields.uploadUrl !== undefined) formData.append('uploadUrl', fields.uploadUrl)
  if (fields.fileType !== undefined) formData.append('fileType', fields.fileType)
  if (fields.start !== undefined) formData.append('start', String(fields.start))
  if (fields.end !== undefined) formData.append('end', String(fields.end))
  if (fields.total !== undefined) formData.append('total', String(fields.total))
  if (fields.chunk) formData.append('chunk', fields.chunk)

  return {
    formData: async () => formData,
  } as unknown as Request
}

describe('POST /api/upload/resource/chunk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects non-Google upload URLs', async () => {
    const response = await POST(makeRequest({
      uploadUrl: 'https://example.com/upload',
      fileType: 'text/plain',
      start: 0,
      end: 4,
      total: 5,
      chunk: new File(['hello'], 'file.txt', { type: 'text/plain' }),
    }) as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('Google Drive 업로드 URL')
  })

  it('forwards a chunk to the Google resumable upload session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('', {
        status: 308,
        headers: { range: 'bytes=0-4' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const response = await POST(makeRequest({
      uploadUrl: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc',
      fileType: 'text/plain',
      start: 0,
      end: 4,
      total: 10,
      chunk: new File(['hello'], 'file.txt', { type: 'text/plain' }),
    }) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'text/plain',
          'Content-Range': 'bytes 0-4/10',
        }),
      }),
    )
    expect(body).toEqual({ done: false, nextStart: 5 })
  })

  it('returns the Drive file id after the final chunk', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'drive-file-id', mimeType: 'text/plain' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ))

    const response = await POST(makeRequest({
      uploadUrl: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=abc',
      fileType: 'text/plain',
      start: 0,
      end: 4,
      total: 5,
      chunk: new File(['hello'], 'file.txt', { type: 'text/plain' }),
    }) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ done: true, id: 'drive-file-id', mimeType: 'text/plain' })
  })
})
