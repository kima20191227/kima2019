import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/upload/resource/drive-finalize/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  cfEnv: vi.fn(),
  makeDriveFilePublic: vi.fn(),
  parseServiceAccountKey: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/cfEnv', () => ({
  cfEnv: mocks.cfEnv,
}))

vi.mock('@/lib/googleDrive', () => ({
  makeDriveFilePublic: mocks.makeDriveFilePublic,
  parseServiceAccountKey: mocks.parseServiceAccountKey,
}))

function makeRequest(body: unknown): Request {
  return {
    json: async () => body,
  } as unknown as Request
}

const VALID_FILE_ID = 'abcdefghij1234567890'

describe('POST /api/upload/resource/drive-finalize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})

    mocks.parseServiceAccountKey.mockReturnValue({
      client_email: 'service@example.iam.gserviceaccount.com',
      private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
    })
    mocks.cfEnv.mockImplementation((key: string) => {
      const env: Record<string, string> = {
        GOOGLE_SERVICE_ACCOUNT_KEY: '{}',
        GOOGLE_DRIVE_RESOURCE_FOLDER_ID: 'drive-folder-id',
      }
      return env[key]
    })
    mocks.makeDriveFilePublic.mockResolvedValue('https://drive.google.com/file/d/abc/view')
  })

  // 회귀 가드 — 청크 업로드는 signed → (드라이브 전송) → drive-finalize 순으로 진행된다.
  // 세 라우트의 권한 기준이 어긋나면, 사용자가 파일을 전부 전송한 뒤 마지막
  // 단계에서 403으로 실패한다. 실제로 9f3e98d가 route·signed만 정회원으로
  // 넓히고 drive-finalize를 빠뜨려 이 증상이 있었다.
  it.each([['PREMIUM'], ['OFFICER'], ['ADMIN']])(
    '%s는 자료 업로드를 완료할 수 있다 (signed 라우트와 같은 기준)',
    async (role) => {
      mocks.auth.mockResolvedValue({ user: { id: 'user-1', role } })

      const response = await POST(
        makeRequest({ fileId: VALID_FILE_ID, fileType: 'application/pdf' }) as never,
      )

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.url).toBe('https://drive.google.com/file/d/abc/view')
      expect(body.storage).toBe('drive')
    },
  )

  it('일반회원(MEMBER)은 403으로 거부한다', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'MEMBER' } })

    const response = await POST(
      makeRequest({ fileId: VALID_FILE_ID, fileType: 'application/pdf' }) as never,
    )

    expect(response.status).toBe(403)
    expect(mocks.makeDriveFilePublic).not.toHaveBeenCalled()
  })

  it('로그인하지 않으면 401로 거부한다', async () => {
    mocks.auth.mockResolvedValue(null)

    const response = await POST(
      makeRequest({ fileId: VALID_FILE_ID, fileType: 'application/pdf' }) as never,
    )

    expect(response.status).toBe(401)
    expect(mocks.makeDriveFilePublic).not.toHaveBeenCalled()
  })

  it('파일 ID 형식이 올바르지 않으면 400으로 거부한다', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'PREMIUM' } })

    const response = await POST(makeRequest({ fileId: 'short', fileType: 'application/pdf' }) as never)

    expect(response.status).toBe(400)
    expect(mocks.makeDriveFilePublic).not.toHaveBeenCalled()
  })
})
