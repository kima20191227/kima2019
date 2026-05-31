import { afterEach, describe, expect, it, vi } from 'vitest'
import { uploadResourceFile } from '@/lib/uploadClient'

describe('uploadResourceFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the uploaded file URL from a JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://storage.example.com/file.txt', fileType: 'text/plain' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ))

    const result = await uploadResourceFile(new File(['hello'], 'file.txt', { type: 'text/plain' }))

    expect(result.url).toBe('https://storage.example.com/file.txt')
    expect(result.fileType).toBe('text/plain')
  })

  it('turns platform 413 responses into a readable upload error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('<html>Payload Too Large</html>', {
        status: 413,
        headers: { 'Content-Type': 'text/html' },
      }),
    ))

    await expect(
      uploadResourceFile(new File(['hello'], 'file.txt', { type: 'text/plain' })),
    ).rejects.toThrow('파일 용량이 너무 큽니다')
  })
})
