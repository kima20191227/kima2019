// KIMA 포럼 만족도·피드백 설문 — 문항·운영 설정을 한곳에서 관리한다.
//
// ▶ 2027년에 재사용하는 방법
//   1) FORUM_SURVEY_KEY, 열고 닫는 시각(OPENS_AT / CLOSES_AT)을 새 연도로 바꾼다.
//   2) 아래 FORUM_SURVEY_QUESTIONS에서 행사에 맞게 문항·보기를 고친다.
//      - 문항 id는 응답 JSON의 키이므로, 연도 간 비교가 필요한 문항은 id를 그대로 둔다.
//      - 폼·서버 검증·관리자 집계·CSV는 이 배열만 읽으므로 다른 파일은 고칠 필요가 없다.
//   3) 응답은 ForumSurveyResponse 테이블에 forumKey별로 쌓이므로 2026 데이터와 섞이지 않는다.
//
// ▶ 2025년 설문(제4회 KIMA 포럼 설문지, 구글폼 6문항) 대비 바뀐 점
//   - '좋았다/불편했다' 2지선다 → 5점 척도: 항목별 평균·분포·연도 비교가 가능해진다.
//   - 장소·숙소·전체 프로그램 3개 → 장소/접근성/숙소/식사/운영/사전안내 + 프로그램 4종 개별 평가.
//   - 포럼 '날짜'를 행사 후에 묻던 문항(보기가 '12월 초' 하나뿐) → 시기·기간·참가비 적절성으로 정리.
//   - 신규: 참석 정보(참석일·참석 횟수·직분), 재참석 의향, 추천 의향(NPS), 2027 희망 주제·진행 방식,
//     시간 배분, 가장 유익했던 프로그램, 좋았던 점, 2027 준비 참여 의향.
//   - 유지: 개선할 점, 참석 소감(서술형).
//   - 소속·이름·연락처는 모두 선택 — 비워 두면 무기명 응답 (RESPONDENT_* 필드).
//   - 문항 초안(개회예배·저녁집회 / 발제·특강 / 조별 토론 / 프로그램 구성·시간 운영 / 숙식·시설 /
//     안내·진행, 은혜가 된 시간, 다룰 주제, 재참석 예·아니오·미정)을 반영했다.
//   - 필수 문항은 핵심 3개로 줄여 응답률을 높였다 (2025는 앞의 4문항이 모두 필수).

/** ForumSurveyResponse.forumKey */
export const FORUM_SURVEY_KEY = '2026'

export const FORUM_SURVEY_TITLE = '2026 KIMA 포럼 피드백 설문'

/** 설문 접수 on/off (false면 기간과 관계없이 받지 않는다) */
export const FORUM_SURVEY_ENABLED = true

/** 설문 시작 — 포럼 마지막 날(12/10) 0시부터. 행사 중에도 바로 참여할 수 있게 한다 */
export const FORUM_SURVEY_OPENS_AT = new Date('2026-12-10T00:00:00+09:00')

/** 설문 마감 — 2027-01-15 23:59:59 KST */
export const FORUM_SURVEY_CLOSES_AT = new Date('2027-01-15T23:59:59+09:00')

export const FORUM_SURVEY_OPENS_TEXT = '2026년 12월 10일(목)'
export const FORUM_SURVEY_CLOSES_TEXT = '2027년 1월 15일(금)'

export type ForumSurveyState = 'before' | 'open' | 'closed'

export function getForumSurveyState(now: Date = new Date()): ForumSurveyState {
  if (!FORUM_SURVEY_ENABLED) return 'closed'
  const t = now.getTime()
  if (t < FORUM_SURVEY_OPENS_AT.getTime()) return 'before'
  if (t > FORUM_SURVEY_CLOSES_AT.getTime()) return 'closed'
  return 'open'
}

// ─── 문항 정의 ────────────────────────────────────────────

/** '기타(직접 입력)' 보기의 값 — allowOther 문항에 자동으로 추가된다 */
export const FORUM_SURVEY_OTHER = '기타'

/** 기타 입력란은 응답 JSON에 `${id}__other` 키로 저장된다 */
export const otherKey = (id: string) => `${id}__other`

export const RATING_LABELS = ['매우 아쉬움', '아쉬움', '보통', '좋음', '매우 좋음'] as const

interface BaseQuestion {
  /** 응답 JSON의 키 — 연도 간 비교가 필요하면 바꾸지 말 것 */
  id: string
  label: string
  /** 보조 설명 (선택) */
  help?: string
  required?: boolean
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating' // 1~5점
}
export interface NpsQuestion extends BaseQuestion {
  type: 'nps' // 0~10점
}
export interface SingleQuestion extends BaseQuestion {
  type: 'single'
  options: readonly string[]
  allowOther?: boolean
}
export interface MultiQuestion extends BaseQuestion {
  type: 'multi'
  options: readonly string[]
  allowOther?: boolean
}
export interface TextQuestion extends BaseQuestion {
  type: 'text'
  placeholder?: string
}

export type ForumSurveyQuestion =
  | RatingQuestion
  | NpsQuestion
  | SingleQuestion
  | MultiQuestion
  | TextQuestion

export interface ForumSurveySection {
  id: string
  title: string
  description?: string
  questions: readonly ForumSurveyQuestion[]
}

export const FORUM_SURVEY_SECTIONS: readonly ForumSurveySection[] = [
  {
    id: 'about',
    title: '1. 참석 정보',
    description: '응답을 유형별로 나누어 보기 위한 질문입니다. 개인을 식별하지 않습니다.',
    questions: [
      {
        id: 'attendDays',
        type: 'multi',
        label: '참석하신 날짜를 모두 선택해 주세요',
        required: true,
        options: ['12월 8일(화)', '12월 9일(수)', '12월 10일(목)'],
      },
      {
        id: 'attendCount',
        type: 'single',
        label: 'KIMA 포럼에 참석하신 것은 몇 번째입니까?',
        options: ['이번이 처음', '2~3번째', '4번째 이상'],
      },
      {
        id: 'role',
        type: 'single',
        label: '현재 역할을 선택해 주세요',
        options: ['목사·선교사', '전도사·신학생', '평신도 사역자·봉사자', '단체 실무자'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'overall',
    title: '2. 전반 평가',
    description: '1점(매우 아쉬움) ~ 5점(매우 좋음)으로 평가해 주세요. 이용하지 않은 항목은 건너뛰어도 됩니다.',
    questions: [
      { id: 'overall', type: 'rating', required: true, label: '이번 포럼에 대한 전체 만족도' },
      { id: 'theme', type: 'rating', label: '주제(Reflection & Outlook)가 현장 사역에 도움이 되었습니까?' },
      { id: 'operation', type: 'rating', label: '진행·운영 (시간 준수, 안내, 진행자 운영)' },
      { id: 'preInfo', type: 'rating', label: '사전 안내·신청 절차 (홈페이지, 입금·환불 안내)' },
      { id: 'venue', type: 'rating', label: '장소 — 시설·환경 (광은기도원)' },
      { id: 'access', type: 'rating', label: '장소 — 교통·주차 등 접근성' },
      { id: 'lodging', type: 'rating', label: '숙소 (숙박하신 분만)' },
      { id: 'meals', type: 'rating', label: '식사 (이용하신 분만)' },
    ],
  },
  {
    id: 'program',
    title: '3. 프로그램 평가',
    questions: [
      { id: 'progWorship', type: 'rating', label: '개회예배·저녁집회' },
      { id: 'progCountry', type: 'rating', label: '국가·지역별 발제와 특강' },
      { id: 'progTarget', type: 'rating', label: '대상별 발제와 특강' },
      { id: 'progGroup', type: 'rating', label: '조별 토론' },
      {
        id: 'program',
        type: 'rating',
        required: true,
        label: '프로그램 구성과 시간 운영',
      },
      {
        id: 'bestProgram',
        type: 'single',
        label: '가장 유익했던 프로그램은 무엇입니까?',
        options: ['개회예배·저녁집회', '국가·지역별 발제와 특강', '대상별 발제와 특강', '조별 토론'],
        allowOther: true,
      },
      {
        id: 'timeBalance',
        type: 'single',
        label: '발제와 토론의 시간 배분은 어땠습니까?',
        options: ['적절했다', '발제를 줄이고 토론을 늘렸으면', '토론을 줄이고 발제를 늘렸으면'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'schedule',
    title: '4. 시기·기간·참가비',
    questions: [
      {
        id: 'period',
        type: 'single',
        label: '포럼 개최 시기(12월 초)는 어떠했습니까?',
        options: ['12월 초가 적절하다', '11월로 앞당겼으면', '1월 이후로 늦췄으면'],
        allowOther: true,
      },
      {
        id: 'duration',
        type: 'single',
        label: '행사 기간(2박 3일)은 어떠했습니까?',
        options: ['적절했다', '짧았다', '길었다'],
        allowOther: true,
      },
      {
        id: 'fee',
        type: 'single',
        label: '참가비(5만 원)는 어떠했습니까?',
        options: ['적정하다', '부담스럽다', '더 낮아도 된다'],
        allowOther: true,
      },
    ],
  },
  {
    id: 'future',
    title: '5. 내년 포럼을 위한 의견',
    questions: [
      {
        id: 'revisit',
        type: 'single',
        required: true,
        label: '내년 KIMA 포럼에 다시 참석하시겠습니까?',
        options: ['예', '미정', '아니오'],
      },
      {
        id: 'nps',
        type: 'nps',
        required: true,
        label: '이 포럼을 동료 사역자에게 추천하시겠습니까?',
        help: '0점(전혀 추천하지 않음) ~ 10점(적극 추천)',
      },
      {
        id: 'topics',
        type: 'multi',
        label: '내년 포럼에서 다루었으면 하는 주제를 모두 선택해 주세요',
        options: [
          '이주민 정책·법령 동향',
          '다음세대·다문화 자녀',
          '난민·미등록 이주민 사역',
          '이주민 리더 양성·훈련',
          '지역교회와 이주민 교회의 협력',
          '비자·법률·행정 실무',
          '상담·돌봄·사역자 탈진 예방',
          '디지털·미디어 활용 사역',
          '귀국 이주민·후속 선교',
          '단체 운영·재정·후원 개발',
        ],
        allowOther: true,
      },
      {
        id: 'formats',
        type: 'multi',
        label: '선호하는 진행 방식을 선택해 주세요',
        options: ['현장 사례 발표', '전문가 강의', '조별 토론', '워크숍·실습', '현장 탐방', '기도회·예배'],
        allowOther: true,
      },
      {
        id: 'volunteer',
        type: 'single',
        label: '내년 포럼 준비(기획·봉사·발제)에 참여할 의향이 있으십니까?',
        help: '"있다"를 선택하시면 아래 6번 항목에 연락처를 남겨 주세요.',
        options: ['있다', '요청이 있으면 고려하겠다', '어렵다'],
      },
    ],
  },
  {
    id: 'comments',
    title: '6. 자유 의견',
    questions: [
      { id: 'good', type: 'text', label: '가장 은혜가 된 시간과 그 이유는 무엇입니까?' },
      { id: 'topicsText', type: 'text', label: '앞으로 다루었으면 하는 주제가 있다면 적어 주세요' },
      { id: 'improve', type: 'text', label: '개선할 점과 자유 의견을 적어 주세요' },
      { id: 'impression', type: 'text', label: '참석하신 소감은 무엇입니까?' },
      {
        id: 'suggestion',
        type: 'text',
        label: '내년 포럼에 바라는 점 (강사·발제자·장소 제안 등)',
      },
    ],
  },
]

export const FORUM_SURVEY_QUESTIONS: readonly ForumSurveyQuestion[] = FORUM_SURVEY_SECTIONS.flatMap(
  (s) => s.questions
)

export const FORUM_SURVEY_TEXT_MAX = 1000
export const FORUM_SURVEY_OTHER_MAX = 200

/** 문항의 선택 보기 (allowOther면 '기타' 포함) */
export function getChoiceOptions(q: SingleQuestion | MultiQuestion): string[] {
  return q.allowOther ? [...q.options, FORUM_SURVEY_OTHER] : [...q.options]
}
