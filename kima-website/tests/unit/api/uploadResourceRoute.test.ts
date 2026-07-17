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

    // 자료 업로드는 정회원(PREMIUM) 이상만 가능하다. (9f3e98d: "정회원도 파일 업로드 허용")
    // 업로드 로직 자체를 검증하기 위해 정책을 만족하는 최소 역할을 사용한다.
    mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'PREMIUM' } })
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

  // 원래 의도("흔치 않은 형식이라고 막지 않는다")는 allowlist 안의 비주류 확장자로 보존한다.
  it('allows uncommon file types that are on the allowlist', async () => {
    mocks.uploadFileToDrive.mockResolvedValue('https://drive.google.com/file/d/archive-file/view')

    const response = await POST(makeRequest(new File(['data'], 'archive.7z', { type: 'application/x-7z-compressed' })) as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.uploadFileToDrive).toHaveBeenCalledWith(
      expect.any(Buffer),
      'archive.7z',
      'application/x-7z-compressed',
      expect.objectContaining({ folderId: 'drive-folder-id' }),
    )
    expect(mocks.upload).not.toHaveBeenCalled()
    expect(body).toEqual({
      url: 'https://drive.google.com/file/d/archive-file/view',
      fileType: 'application/x-7z-compressed',
      storage: 'drive',
    })
  })

  // a30f153("파일 업로드 보안 강화")이 .exe 제거와 함께 확장자 allowlist를 의도적으로 도입했다.
  // f27f887의 "모든 형식 허용" 전제는 이 커밋으로 폐기되었으므로 거부 동작을 검증한다.
  it('rejects file types outside the allowlist before uploading', async () => {
    const response = await POST(makeRequest(new File(['<html></html>'], 'page.html', { type: 'text/html' })) as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('허용되지 않는 파일 형식')
    expect(mocks.uploadFileToDrive).not.toHaveBeenCalled()
    expect(mocks.upload).not.toHaveBeenCalled()
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
