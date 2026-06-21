import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH, DELETE } from '@/app/api/admin/news/[id]/route'
import { POST as bulkDelete } from '@/app/api/admin/news/bulk-delete/route'
import { POST as deleteHidden } from '@/app/api/admin/news/delete-hidden/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    news: {
      update: mocks.update,
      delete: mocks.delete,
      deleteMany: mocks.deleteMany,
    },
  },
}))

function makeRequest(body?: unknown): Request {
  return { json: async () => body } as unknown as Request
}

describe('admin news routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('non-admin access', () => {
    beforeEach(() => {
      mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'MEMBER' } })
    })

    it('PATCH /api/admin/news/[id] rejects non-admin', async () => {
      const response = await PATCH(makeRequest({ isVisible: false }) as never, {
        params: Promise.resolve({ id: 'news-1' }),
      })
      expect(response.status).toBe(403)
      expect(mocks.update).not.toHaveBeenCalled()
    })

    it('DELETE /api/admin/news/[id] rejects non-admin', async () => {
      const response = await DELETE(makeRequest() as never, {
        params: Promise.resolve({ id: 'news-1' }),
      })
      expect(response.status).toBe(403)
      expect(mocks.delete).not.toHaveBeenCalled()
    })

    it('POST /api/admin/news/bulk-delete rejects non-admin', async () => {
      const response = await bulkDelete(makeRequest({ ids: ['news-1'] }) as never)
      expect(response.status).toBe(403)
      expect(mocks.deleteMany).not.toHaveBeenCalled()
    })

    it('POST /api/admin/news/delete-hidden rejects non-admin', async () => {
      const response = await deleteHidden(makeRequest() as never)
      expect(response.status).toBe(403)
      expect(mocks.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe('admin access', () => {
    beforeEach(() => {
      mocks.auth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    })

    it('PATCH toggles isVisible', async () => {
      mocks.update.mockResolvedValue({ id: 'news-1', isVisible: false })
      const response = await PATCH(makeRequest({ isVisible: false }) as never, {
        params: Promise.resolve({ id: 'news-1' }),
      })
      expect(response.status).toBe(200)
      expect(mocks.update).toHaveBeenCalledWith({ where: { id: 'news-1' }, data: { isVisible: false } })
    })

    it('PATCH rejects invalid body', async () => {
      const response = await PATCH(makeRequest({ isVisible: 'nope' }) as never, {
        params: Promise.resolve({ id: 'news-1' }),
      })
      expect(response.status).toBe(400)
      expect(mocks.update).not.toHaveBeenCalled()
    })

    it('DELETE removes a single news item', async () => {
      mocks.delete.mockResolvedValue({ id: 'news-1' })
      const response = await DELETE(makeRequest() as never, {
        params: Promise.resolve({ id: 'news-1' }),
      })
      expect(response.status).toBe(200)
      expect(mocks.delete).toHaveBeenCalledWith({ where: { id: 'news-1' } })
    })

    it('bulk-delete removes multiple ids', async () => {
      mocks.deleteMany.mockResolvedValue({ count: 2 })
      const response = await bulkDelete(makeRequest({ ids: ['news-1', 'news-2'] }) as never)
      const json = await response.json()
      expect(response.status).toBe(200)
      expect(json).toEqual({ ok: true, deletedCount: 2 })
      expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['news-1', 'news-2'] } } })
    })

    it('bulk-delete rejects an empty ids array', async () => {
      const response = await bulkDelete(makeRequest({ ids: [] }) as never)
      expect(response.status).toBe(400)
      expect(mocks.deleteMany).not.toHaveBeenCalled()
    })

    it('delete-hidden removes all hidden news', async () => {
      mocks.deleteMany.mockResolvedValue({ count: 146 })
      const response = await deleteHidden(makeRequest() as never)
      const json = await response.json()
      expect(response.status).toBe(200)
      expect(json).toEqual({ ok: true, deletedCount: 146 })
      expect(mocks.deleteMany).toHaveBeenCalledWith({ where: { isVisible: false } })
    })
  })
})
