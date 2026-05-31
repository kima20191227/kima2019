import type { AccessLevel, LegalCategory, LegalSectionType, LegalSourceType, UserRole } from '@prisma/client'

export const LEGAL_CATEGORY_ORDER: LegalCategory[] = [
  'MULTICULTURAL_FAMILY',
  'IMMIGRATION',
  'VISA_POLICY',
  'REFUGEE',
  'EMPLOYMENT',
  'SOCIAL_WELFARE',
  'OTHER',
]

export const LEGAL_CATEGORY_META: Record<
  LegalCategory,
  { label: string; description: string; className: string }
> = {
  MULTICULTURAL_FAMILY: {
    label: '다문화가족지원법',
    description: '다문화가족 지원, 교육, 상담, 가족센터 관련 제도',
    className: 'bg-pink-50 text-pink-700 border-pink-100',
  },
  IMMIGRATION: {
    label: '출입국관리법',
    description: '체류, 입국, 출국, 등록, 강제퇴거 관련 법령',
    className: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  VISA_POLICY: {
    label: '비자제도',
    description: '사증, 체류자격, 비자 변경 및 정책 안내',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  REFUGEE: {
    label: '난민법',
    description: '난민 신청, 심사, 처우, 인도적 체류 관련 법령',
    className: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  EMPLOYMENT: {
    label: '외국인고용법',
    description: '고용허가제, 사업장 변경, 근로자 권리 관련 제도',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  SOCIAL_WELFARE: {
    label: '사회보장',
    description: '건강보험, 복지, 긴급지원 등 사회보장 관련 법령',
    className: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  },
  OTHER: {
    label: '기타',
    description: '그 밖의 이주민·다문화 관련 법령과 제도',
    className: 'bg-gray-50 text-gray-700 border-gray-100',
  },
}

export const ACCESS_LEVEL_META: Record<AccessLevel, { label: string; className: string }> = {
  PUBLIC: { label: '공개', className: 'bg-green-50 text-green-700 border-green-100' },
  MEMBER: { label: '회원', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  PREMIUM: { label: '정회원', className: 'bg-amber-50 text-amber-700 border-amber-100' },
}

export const LEGAL_SECTION_ORDER: LegalSectionType[] = [
  'OVERVIEW',
  'SOURCE_LINKS',
  'PRACTICAL_GUIDE',
  'EXPERT_MATERIAL',
]

export const LEGAL_SECTION_META: Record<
  LegalSectionType,
  { label: string; description: string; defaultAccessLevel: AccessLevel }
> = {
  OVERVIEW: {
    label: '한눈에 보기',
    description: '무엇을 위한 법인지, 누가 대상인지, 핵심 조항은 무엇인지 정리합니다.',
    defaultAccessLevel: 'PUBLIC',
  },
  SOURCE_LINKS: {
    label: '법령 원문 링크',
    description: '국가법령정보센터 등 공식 원문 확인 경로를 제공합니다.',
    defaultAccessLevel: 'PUBLIC',
  },
  PRACTICAL_GUIDE: {
    label: '실무 해설',
    description: '사역 현장 FAQ, 절차, 주의사항을 KIMA 관점으로 정리합니다.',
    defaultAccessLevel: 'MEMBER',
  },
  EXPERT_MATERIAL: {
    label: '전문 자료',
    description: '변호사·행정사 기고, 판례 분석, 복잡 사례 Q&A를 제공합니다.',
    defaultAccessLevel: 'PREMIUM',
  },
}

export const LEGAL_SOURCE_TYPE_META: Record<LegalSourceType, { label: string; className: string }> = {
  LAW_API: { label: '법제처 API', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  RSS: { label: 'RSS', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  WEB: { label: '웹 변경 감지', className: 'bg-gray-50 text-gray-700 border-gray-100' },
}

const ROLE_WEIGHT: Record<UserRole, number> = {
  MEMBER: 1,
  PREMIUM: 2,
  OFFICER: 3,
  ADMIN: 4,
}

export function getAllowedLegalAccessLevels(role?: UserRole | null): AccessLevel[] {
  const weight = role ? (ROLE_WEIGHT[role] ?? 0) : 0
  if (weight >= 2) return ['PUBLIC', 'MEMBER', 'PREMIUM']
  if (weight >= 1) return ['PUBLIC', 'MEMBER']
  return ['PUBLIC']
}

export function parseLegalCategory(value?: string | null): LegalCategory | undefined {
  if (!value) return undefined
  const upper = value.toUpperCase() as LegalCategory
  return LEGAL_CATEGORY_ORDER.includes(upper) ? upper : undefined
}

export function formatLegalDate(date?: Date | string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
