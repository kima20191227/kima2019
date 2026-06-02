import type { Prisma } from '@prisma/client'

export function ministryResourceWhere(categoryId?: string | null): Prisma.ResourceWhereInput {
  if (categoryId) return { categoryId }

  return {
    OR: [
      { section: 'MINISTRY' },
      { categoryId: { not: null } },
    ],
  }
}
