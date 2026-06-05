// ─── 열거형 ──────────────────────────────────────────────────────────────────

export type UserRole = 'MEMBER' | 'PREMIUM' | 'OFFICER' | 'ADMIN'
export type PostType = 'NOTICE' | 'SHARE' | 'INTRODUCE'
export type AccessLevel = 'PUBLIC' | 'MEMBER' | 'PREMIUM'
export type CategoryType = 'REGION' | 'LANGUAGE' | 'TARGET'
export type StoryType = 'NOTICE' | 'NEWS' | 'FIELD_STORY' | 'EVENT_MEDIA' | 'EVENT_PROMO' | 'PRAYER_REQUEST'

// ─── 사용자 ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: UserRole
  organization: string | null
  region: string | null
  phone: string | null
  position: string | null
  denomination: string | null
  address: string | null
  approvedAt: string | null  // ISO8601
  expiresAt: string | null   // ISO8601 — 정회원 만료일
  createdAt: string          // ISO8601
  premiumNote: string | null
  providers: string[]        // ['credentials', 'google', ...]
}

// ─── 조직/단체 ────────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  nameEn: string | null
  description: string | null
  region: string
  languages: string[]
  targets: string[]
  type: string | null
  address: string | null
  lat: number | null
  lng: number | null
  phone: string | null
  email: string | null
  website: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// ─── 카테고리 ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  type: CategoryType
  name: string
  slug: string
  order: number
  officerName: string | null
  officerSns: string | null
  officerQr: string | null
  createdAt: string
}

// ─── 게시글 ───────────────────────────────────────────────────────────────────

export interface Post {
  id: string
  title: string
  content: string
  type: PostType
  categoryId: string
  category?: Category
  authorId: string
  author?: Pick<User, 'id' | 'name' | 'image'>
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// ─── 자료 ─────────────────────────────────────────────────────────────────────

export interface Resource {
  id: string
  title: string
  description: string | null
  driveUrl: string
  fileType: string | null
  accessLevel: AccessLevel
  categoryId: string | null
  category?: Category
  createdAt: string
  updatedAt: string
}

// ─── 행사 ─────────────────────────────────────────────────────────────────────

export interface Event {
  id: string
  title: string
  description: string | null
  type: string
  scheduledAt: string  // ISO8601
  zoomUrl: string | null  // 로그인 회원만 표시
  maxAttendees: number | null
  createdAt: string
  attendeeCount?: number
}

// ─── 스토리 ───────────────────────────────────────────────────────────────────

export interface Story {
  id: string
  title: string
  content: string
  type: StoryType
  authorId: string | null
  author?: Pick<User, 'id' | 'name' | 'image'> | null
  thumbnail: string | null
  videoUrls: string[]
  tags: string[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// ─── API 응답 공통 ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  details?: unknown
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'expiresAt'>
}

// ─── 유틸리티 타입 ────────────────────────────────────────────────────────────

/** role 계층 체크: ADMIN > OFFICER > PREMIUM > MEMBER */
export function hasRole(userRole: UserRole, required: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    MEMBER: 1,
    PREMIUM: 2,
    OFFICER: 3,
    ADMIN: 4,
  }
  return hierarchy[userRole] >= hierarchy[required]
}

/** 정회원 활성 여부 (role + expiresAt 동시 체크) */
export function isActivePremium(user: Pick<User, 'role' | 'expiresAt'>): boolean {
  if (user.role === 'ADMIN' || user.role === 'OFFICER') return true
  if (user.role !== 'PREMIUM') return false
  if (!user.expiresAt) return true
  return new Date(user.expiresAt) > new Date()
}
