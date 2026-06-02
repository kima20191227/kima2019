import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/upload/resource/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cfEnv: vi.fn(),
  uploadFileToDrive: vi.fn(),
  createAdminClient: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  safeStorageKey: vi.fn(),
  isConvertibleImage: vi.fn(),
  convertToWebP: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/cfEnv', () => ({
  cfEnv: mocks.cfEnv,
}))

vi.mock('@/lib/googleDrive', () => ({
  uploadFileToDrive: mocks.uploadFileToDrive,
}))

vi.mock('@/lib/supabase', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/utils', () => ({
  safeStorageKey: mocks.safeStorageKey,
}))

vi.mock('@/lib/imageConvert', () => ({
  isConvertibleImage: mocks.isConvertibleImage,
  convertToWebP: mocks.convertToWebP,
}))

function makeRequest(file: File): Request {
  return {
    formData: async () => ({
      get: (name: string) => (name === 'file' ? file : null),
    }),
  } as unknown as Request
}

describe('POST /api/upload/resource', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'MEMBER' } })
    mocks.cfEnv.mockImplementation((key: string) => {
      const env: Record<string, string> = {
        GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
          client_email: 'service@example.iam.gserviceaccount.com',
          private_key: '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n',
        }),
        GOOGLE_DRIVE_RESOURCE_FOLDER_ID: 'drive-folder-id',
      }
      return env[key]
    })
    mocks.isConvertibleImage.mockReturnValue(false)
    mocks.safeStorageKey.mockReturnValue('community/file.txt')
    mocks.upload.mockResolvedValue({ error: null })
    mocks.getPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/community/file.txt' },
    })
    mocks.createAdminClient.mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: mocks.upload,
          getPublicUrl: mocks.getPublicUrl,
        })),
      },
    })
  })

  it('falls back to Supabase Storage when Google Drive upload fails', async () => {
    mocks.uploadFileToDrive.mockRejectedValue(new Error('Drive upload failed: File not found'))

    const response = await POST(makeRequest(new File(['hello'], 'file.txt', { type: 'text/plain' })) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.uploadFileToDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      'file.txt',
      'text/plain',
      expect.objectContaining({ folderId: 'drive-folder-id' }),
    )
    expect(mocks.upload).toHaveBeenCalledWith(
      'community/file.txt',
      expect.any(Buffer),
      expect.objectContaining({ contentType: 'text/plain' }),
    )
    expect(body).toEqual({
      url: 'https://storage.example.com/community/file.txt',
      fileType: 'text/plain',
      storage: 'supabase',
    })
  })

  it('allows uncommon file types instead of rejecting by format', async () => {
    mocks.uploadFileToDrive.mockResolvedValue('https://drive.google.com/file/d/exe-file/view')

    const response = await POST(makeRequest(new File(['<html></html>'], 'page.html', { type: 'text/html' })) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.uploadFileToDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      'page.html',
      'text/html',
      expect.objectContaining({ folderId: 'drive-folder-id' }),
    )
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(body).toEqual({
      url: 'https://drive.google.com/file/d/exe-file/view',
      fileType: 'text/html',
      storage: 'drive',
    })
  })

  it('allows common Korean document uploads when the browser sends octet-stream', async () => {
    mocks.uploadFileToDrive.mockResolvedValue('https://drive.google.com/file/d/file-id/view')

    const response = await POST(makeRequest(new File(['hwp'], 'document.hwp', { type: 'application/octet-stream' })) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.uploadFileToDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      'document.hwp',
      'application/x-hwp',
      expect.objectContaining({ folderId: 'drive-folder-id' }),
    )
    expect(body).toEqual({
      url: 'https://drive.google.com/file/d/file-id/view',
      fileType: 'application/x-hwp',
      storage: 'drive',
    })
  })
})
