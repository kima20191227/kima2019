// 2026 KIMA 포럼 — 행사 정보·신청 설정을 한곳에서 관리한다.
// 포스터 문구를 그대로 옮긴 값이므로 수정 시 포스터와 함께 확인할 것.

/** ForumRegistration.forumKey — 다음 포럼은 새 키로 같은 테이블을 재사용 */
export const FORUM_KEY = '2026'

/** 신청 접수 on/off (false면 페이지는 보이되 신청을 받지 않는다) */
export const FORUM_IS_OPEN = true

/** 신청 마감 — 2026-12-07 23:59:59 KST */
export const FORUM_DEADLINE = new Date('2026-12-07T23:59:59+09:00')

export const FORUM_INFO = {
  title: '2026 KIMA 포럼',
  subtitle: 'Reflection & Outlook',
  theme: '이주민의 창으로 한국 이주민 선교를 돌아보고 미래를 바라본다',
  verse: '너희는 이전 일을 기억하지 말며 옛날 일을 생각하지 말라 보라 내가 새 일을 행하리니',
  verseRef: '이사야 43:18',
  dateText: '2026년 12월 8일(화) ~ 12월 10일(목)',
  venueName: '광은기도원',
  venueAddress: '경기도 평택시 진위면 동천리 152-5',
  feeText: '5만 원',
  program: ['국가·지역별 발제', '대상별 발제', '조별 토론', '저녁 집회'],
  host: '한국이주민선교연합회(KIMA)',
} as const

export const FORUM_BANK = {
  bank: '하나은행',
  account: '435-910079-52904',
  holder: '한국이주민선교연합회',
} as const

/** 개인정보 보유 기간 (신청 폼 동의 문구) — 확정 필요 시 이 값만 수정 */
export const FORUM_PRIVACY_RETENTION = '행사 종료 후 1년 이내 파기'

/** 참석 일정 선택지 — value는 DB(attendDays)에 저장되는 값 */
export const FORUM_DAYS = [
  { value: '2026-12-08', label: '12월 8일(화)' },
  { value: '2026-12-09', label: '12월 9일(수)' },
  { value: '2026-12-10', label: '12월 10일(목)' },
] as const

export type ForumDayValue = (typeof FORUM_DAYS)[number]['value']

export function getForumDayLabel(value: string) {
  return FORUM_DAYS.find((d) => d.value === value)?.label ?? value
}

/** 신청 가능 여부 (접수 플래그 + 마감 시각) */
export function isForumRegistrationOpen(now: Date = new Date()) {
  return FORUM_IS_OPEN && now.getTime() <= FORUM_DEADLINE.getTime()
}
