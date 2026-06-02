import { afterEach, describe, expect, it, vi } from 'vitest'
import { uploadResourceFile } from '@/lib/uploadClient'

describe('uploadResourceFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the uploaded file URL from a signed Drive upload', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          uploadUrl: 'https://upload.example.com/session',
          fileType: 'text/plain',
          storage: 'drive',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'drive-file-id', mimeType: 'text/plain' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: 'https://drive.example.com/file.txt', fileType: 'text/plain' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await uploadResourceFile(new File(['hello'], 'file.txt', { type: 'text/plain' }))

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/upload/resource/signed', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://upload.example.com/session', expect.objectContaining({ method: 'PUT' }))
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/upload/resource/drive-finalize', expect.objectContaining({ method: 'POST' }))
    expect(result.url).toBe('https://drive.example.com/file.txt')
    expect(result.fileType).toBe('text/plain')
  })

  it('falls back to the server upload route when the Drive session fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Drive 업로드 세션 발급 실패: File not found' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          url: 'https://storage.example.com/file.exe',
          fileType: 'application/octet-stream',
          storage: 'supabase',
        }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const result = await uploadResourceFile(new File(['hello'], 'file.exe', { type: 'application/octet-stream' }))

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/upload/resource/signed', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/upload/resource', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData),
    }))
    expect(result.url).toBe('https://storage.example.com/file.exe')
    expect(result.fileType).toBe('application/octet-stream')
  })

  it('turns platform 413 responses into a readable upload error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(
      new Response('<html>Payload Too Large</html>', {
        status: 413,
        headers: { 'Content-Type': 'text/html' },
      }),
    )))

    await expect(
      uploadResourceFile(new File(['hello'], 'file.txt', { type: 'text/plain' })),
    ).rejects.toThrow('파일 용량이 너무 큽니다')
  })
})
