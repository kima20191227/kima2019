import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH } from '@/app/api/admin/legal-documents/[id]/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    legalDocument: {
      update: mocks.update,
    },
  },
}))

function makePatchRequest(body: unknown): Request {
  return {
    json: async () => body,
  } as unknown as Request
}

describe('PATCH /api/admin/legal-documents/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mocks.update.mockResolvedValue({
      id: 'legal-1',
      title: 'Updated legal title',
      isLatest: false,
      accessLevel: 'PREMIUM',
      sections: [],
    })
  })

  it('does not save default fields that are absent from the request body', async () => {
    const response = await PATCH(
      makePatchRequest({ title: 'Updated legal title' }) as never,
      { params: Promise.resolve({ id: 'legal-1' }) },
    )

    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'legal-1' },
      data: { title: 'Updated legal title' },
    }))
  })

  it('saves defaulted fields when they are explicitly present', async () => {
    await PATCH(
      makePatchRequest({ isLatest: true, accessLevel: 'PUBLIC' }) as never,
      { params: Promise.resolve({ id: 'legal-1' }) },
    )

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { isLatest: true, accessLevel: 'PUBLIC' },
    }))
  })
})
