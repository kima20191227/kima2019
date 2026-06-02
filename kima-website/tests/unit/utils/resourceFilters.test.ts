import { describe, expect, it } from 'vitest'
import { ministryResourceWhere } from '@/lib/resourceFilters'

describe('ministryResourceWhere', () => {
  it('includes ministry resources and categorized community resources', () => {
    expect(ministryResourceWhere()).toEqual({
      OR: [
        { section: 'MINISTRY' },
        { categoryId: { not: null } },
      ],
    })
  })

  it('shows every resource in the selected ministry category regardless of stored section', () => {
    expect(ministryResourceWhere('category-1')).toEqual({ categoryId: 'category-1' })
  })
})
