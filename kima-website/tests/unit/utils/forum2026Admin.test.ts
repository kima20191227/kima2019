import { describe, expect, it } from 'vitest'
import {
  buildForumAdminWhere,
  filterForumRowsByStay,
  findDuplicatePhones,
  formatForumStayShort,
  forumAdminQueryString,
  forumDayCounts,
  FORUM_EXPORT_COLUMNS,
  getForumStay,
  parseForumAdminFilters,
  phoneSearchPatterns,
} from '@/lib/forum2026Admin'

describe('parseForumAdminFilters', () => {
  it('배열 값은 첫 번째 값을 쓴다', () => {
    expect(parseForumAdminFilters({ status: ['CONFIRMED', 'PENDING'], q: '김' })).toMatchObject({
      status: 'CONFIRMED',
      q: '김',
    })
  })
})

describe('phoneSearchPatterns', () => {
  it('하이픈을 가로지르는 숫자 검색어를 저장 형식 패턴으로 바꾼다', () => {
    const patterns = phoneSearchPatterns('12345678')
    expect(patterns).toContain('1234-5678') // 010-1234-5678
    expect(phoneSearchPatterns('01012345678')).toContain('010-1234-5678')
    expect(phoneSearchPatterns('0101234567')).toContain('010-123-4567')
  })

  it('숫자가 3자리 미만이면 패턴을 만들지 않는다', () => {
    expect(phoneSearchPatterns('홍길동')).toEqual([])
    expect(phoneSearchPatterns('12')).toEqual([])
  })

  it('만든 패턴 중 하나는 실제 저장값에 포함된다', () => {
    const stored = '010-9876-5432'
    for (const q of ['98765432', '0109876', '65432', '010-98765432']) {
      expect(phoneSearchPatterns(q).some((p) => stored.includes(p))).toBe(true)
    }
  })
})

describe('buildForumAdminWhere', () => {
  it('필터가 없으면 forumKey만 건다', () => {
    expect(buildForumAdminWhere({})).toEqual({ forumKey: '2026' })
  })

  it('상태·일자·검색어 조건을 만들고, 숙박·식사는 DB 조건에 넣지 않는다', () => {
    const where = buildForumAdminWhere({ status: 'PENDING', day: '2026-12-08', lodging: 'Y', meal: 'N', q: 'Kim' })
    expect(where).toMatchObject({
      forumKey: '2026',
      paymentStatus: 'PENDING',
      attendDays: { has: '2026-12-08' },
    })
    expect(where).not.toHaveProperty('needsLodging')
    expect(where).not.toHaveProperty('needsMeals')
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { name: { contains: 'Kim', mode: 'insensitive' } },
        { email: { contains: 'Kim', mode: 'insensitive' } },
        { depositorName: { contains: 'Kim', mode: 'insensitive' } },
        { organization: { contains: 'Kim', mode: 'insensitive' } },
      ])
    )
  })

  it('ignoreStatus면 상태 조건을 뺀다', () => {
    expect(buildForumAdminWhere({ status: 'CONFIRMED' }, { ignoreStatus: true })).toEqual({ forumKey: '2026' })
  })
})

describe('forumAdminQueryString', () => {
  it('필터를 유지하면서 상태만 바꾼다', () => {
    const qs = forumAdminQueryString({ status: 'PENDING', q: '홍', lodging: 'Y' }, { status: 'CONFIRMED' })
    const params = new URLSearchParams(qs.slice(1))
    expect(params.get('status')).toBe('CONFIRMED')
    expect(params.get('q')).toBe('홍')
    expect(params.get('lodging')).toBe('Y')
  })

  it('상태를 지우고 남은 필터가 없으면 빈 문자열', () => {
    expect(forumAdminQueryString({ status: 'PENDING' }, { status: undefined })).toBe('')
  })
})

describe('findDuplicatePhones', () => {
  it('숫자 기준으로 같은 번호를 찾는다', () => {
    const dupes = findDuplicatePhones([
      { phone: '010-1111-2222' },
      { phone: '01011112222' },
      { phone: '010-3333-4444' },
    ])
    expect([...dupes]).toEqual(['01011112222'])
  })
})

const stay = (over: Partial<Parameters<typeof getForumStay>[0]> = {}) => ({
  attendDays: ['2026-12-08', '2026-12-09', '2026-12-10'],
  lodgingDays: [] as string[],
  mealDays: [] as string[],
  needsLodging: false,
  needsMeals: false,
  ...over,
})

describe('getForumStay', () => {
  it('날짜별 값이 있으면 그대로(정렬·허용값만) 쓴다', () => {
    expect(
      getForumStay(stay({ lodgingDays: ['2026-12-09', '2026-12-08'], mealDays: ['2026-12-10', '2026-12-08'], needsLodging: true, needsMeals: true }))
    ).toEqual({ lodgingDays: ['2026-12-08', '2026-12-09'], mealDays: ['2026-12-08', '2026-12-10'] })
  })

  it('구 형식(배열 비어 있음 + needsLodging/needsMeals)은 참석한 모든 밤·날로 본다', () => {
    expect(getForumStay(stay({ needsLodging: true, needsMeals: true }))).toEqual({
      lodgingDays: ['2026-12-08', '2026-12-09'], // 12/10 밤은 숙박 없음
      mealDays: ['2026-12-08', '2026-12-09', '2026-12-10'],
    })
    expect(getForumStay(stay({ attendDays: ['2026-12-09', '2026-12-10'], needsLodging: true, needsMeals: true }))).toEqual({
      lodgingDays: ['2026-12-09'],
      mealDays: ['2026-12-09', '2026-12-10'],
    })
  })

  it('구 형식에서 마지막 날만 참석하면 숙박 밤이 없다', () => {
    expect(getForumStay(stay({ attendDays: ['2026-12-10'], needsLodging: true })).lodgingDays).toEqual([])
  })

  it('숙박·식사 모두 없으면 빈 배열', () => {
    expect(getForumStay(stay())).toEqual({ lodgingDays: [], mealDays: [] })
  })
})

describe('formatForumStayShort', () => {
  it('목록용 요약 문구를 만든다', () => {
    expect(
      formatForumStayShort(stay({ lodgingDays: ['2026-12-08', '2026-12-09'], mealDays: ['2026-12-08', '2026-12-09', '2026-12-10'] }))
    ).toBe('숙박 8·9일 / 식사 8·9·10일')
    expect(formatForumStayShort(stay())).toBe('숙박 없음 / 식사 없음')
    expect(formatForumStayShort(stay({ needsMeals: true, attendDays: ['2026-12-10'] }))).toBe('숙박 없음 / 식사 10일')
  })
})

describe('filterForumRowsByStay', () => {
  const rows = [
    { id: 'new89', ...stay({ lodgingDays: ['2026-12-08', '2026-12-09'], mealDays: ['2026-12-09'] }) },
    { id: 'legacy', ...stay({ attendDays: ['2026-12-09', '2026-12-10'], needsLodging: true, needsMeals: true }) },
    { id: 'none', ...stay() },
  ]
  const ids = (filters: Parameters<typeof filterForumRowsByStay>[1]) => filterForumRowsByStay(rows, filters).map((r) => r.id)

  it('있음/없음/특정 날짜로 거르고 구 형식 행도 보정해서 판단한다', () => {
    expect(ids({})).toEqual(['new89', 'legacy', 'none'])
    expect(ids({ lodging: 'Y' })).toEqual(['new89', 'legacy'])
    expect(ids({ lodging: 'N' })).toEqual(['none'])
    expect(ids({ lodging: '2026-12-08' })).toEqual(['new89'])
    expect(ids({ lodging: '2026-12-09' })).toEqual(['new89', 'legacy'])
    expect(ids({ meal: '2026-12-10' })).toEqual(['legacy'])
    expect(ids({ meal: 'N' })).toEqual(['none'])
    expect(ids({ lodging: 'Y', meal: '2026-12-09' })).toEqual(['new89', 'legacy'])
  })
})

describe('FORUM_EXPORT_COLUMNS 숙박일·식사일', () => {
  it('날짜 라벨로 내보내고 구 형식 행도 보정한다', () => {
    const legacy = stay({ attendDays: ['2026-12-08', '2026-12-09'], needsLodging: true, needsMeals: true })
    // CSV 열 함수는 ForumRegistration 전체를 받지만 숙박·식사 열은 해당 필드만 읽는다
    const row = legacy as unknown as Parameters<(typeof FORUM_EXPORT_COLUMNS)['lodging']['cells']>[0]
    expect(FORUM_EXPORT_COLUMNS.lodging.headers).toEqual(['숙박일'])
    expect(FORUM_EXPORT_COLUMNS.lodging.cells(row)).toEqual(['12월 8일(화) 밤, 12월 9일(수) 밤'])
    expect(FORUM_EXPORT_COLUMNS.meals.headers).toEqual(['식사일'])
    expect(FORUM_EXPORT_COLUMNS.meals.cells(row)).toEqual(['12월 8일(화), 12월 9일(수)'])
  })
})

describe('forumDayCounts', () => {
  it('취소 건을 빼고 날짜별 숙박(그날 밤)·식사 인원을 센다 (12/10 숙박은 null)', () => {
    const counts = forumDayCounts([
      {
        paymentStatus: 'CONFIRMED',
        ...stay({ attendDays: ['2026-12-08', '2026-12-09'], lodgingDays: ['2026-12-08'], mealDays: ['2026-12-08', '2026-12-09'] }),
      },
      { paymentStatus: 'PENDING', ...stay({ attendDays: ['2026-12-09'], mealDays: ['2026-12-09'] }) },
      // 구 형식 — 8·9일 숙박, 8·9·10일 식사로 보정
      { paymentStatus: 'PENDING', ...stay({ needsLodging: true, needsMeals: true }) },
      { paymentStatus: 'CANCELLED', ...stay({ lodgingDays: ['2026-12-08'], mealDays: ['2026-12-08'] }) },
    ])
    expect(counts.map(({ value, attend, lodging, meals }) => ({ value, attend, lodging, meals }))).toEqual([
      { value: '2026-12-08', attend: 2, lodging: 2, meals: 2 },
      { value: '2026-12-09', attend: 3, lodging: 1, meals: 3 },
      { value: '2026-12-10', attend: 1, lodging: null, meals: 1 },
    ])
  })
})
