import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH } from '@/app/api/resources/[id]/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    resource: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}))

function makePatchRequest(body: unknown): Request {
  return {
    json: async () => body,
  } as unknown as Request
}

describe('PATCH /api/resources/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'OFFICER' } })
    mocks.findUnique.mockResolvedValue({ section: 'MINISTRY', uploadedById: 'other-user' })
    mocks.update.mockResolvedValue({
      id: 'resource-1',
      title: 'Updated title',
      section: 'MINISTRY',
      uploadedById: 'other-user',
      createdAt: new Date('2026-06-02T00:00:00Z'),
      updatedAt: new Date('2026-06-02T00:00:00Z'),
      category: null,
    })
  })

  it('updates only fields present in the request body', async () => {
    const response = await PATCH(
      makePatchRequest({ title: 'Updated title' }) as never,
      { params: Promise.resolve({ id: 'resource-1' }) },
    )

    expect(response.status).toBe(200)
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'resource-1' },
      data: { title: 'Updated title' },
    }))
  })

  it('allows explicit section changes when section is present', async () => {
    await PATCH(
      makePatchRequest({ section: 'PUBLIC' }) as never,
      { params: Promise.resolve({ id: 'resource-1' }) },
    )

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { section: 'PUBLIC' },
    }))
  })
})
