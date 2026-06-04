# KIMA 홈페이지 개발 마스터 문서
# 한국이주민선교연합회 | kima2019.org

> 이 파일은 VS Code Claude Code가 항상 참조하는 프로젝트 컨텍스트입니다.
> 모든 개발 결정은 이 문서를 기준으로 합니다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 단체명 | 한국이주민선교연합회 (KIMA) |
| 도메인 | kima2019.org |
| 목적 | 전국 다문화사역 연합 플랫폼 |
| 슬로건 | "연결하고 · 기록하고 · 보이게 하고 · 후원으로 이어주는" |

---

## 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| 프레임워크 | Next.js (App Router) | 14.x |
| 언어 | TypeScript | 5.x |
| 스타일 | Tailwind CSS | 3.x |
| 인증 | NextAuth.js (Auth.js) | 5.x |
| DB·백엔드 | Supabase (PostgreSQL) | latest |
| ORM | Prisma | 5.x |
| 스키마 검증 | Zod | 3.x |
| 폼 관리·검증 | React Hook Form + Zod resolver | latest |
| 단위·컴포넌트 테스트 | Vitest + Testing Library | latest |
| E2E 테스트 | Playwright | latest |
| 배포 | Cloudflare Pages | - |
| CDN·보안 | Cloudflare (프록시·WAF·DDoS) | - |
| Cron Jobs | Cloudflare Workers Cron | - |
| 도메인 | 가비아 구매 → Cloudflare 네임서버 위임 | - |

---

## 디렉토리 구조

```
kima-website/
├── AGENTS.md
├── CLAUDE.md                  ← 이 파일 (항상 참조)
├── DEPLOY_CHECKLIST.md
├── README.md
├── eslint.config.mjs
├── kima_logo.png
├── next.config.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
├── postcss.config.mjs
├── prisma/
│   ├── schema.prisma          ← DB 스키마
│   └── seed.ts                ← 초기 데이터
├── prisma.config.ts
├── public/
│   ├── _headers
│   ├── _redirects
│   ├── file.svg
│   ├── globe.svg
│   ├── images/
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/                   ← Next.js App Router
│   │   ├── layout.tsx         ← 루트 레이아웃
│   │   ├── page.tsx           ← 홈
│   │   ├── globals.css
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   ├── favicon.ico
│   │   ├── (public)/          ← 비회원 접근 가능
│   │   │   ├── about/
│   │   │   ├── directory/
│   │   │   ├── story/
│   │   │   ├── data/
│   │   │   ├── donate/
│   │   │   ├── privacy/
│   │   │   └── terms/
│   │   ├── (member)/          ← 일반회원 이상
│   │   │   ├── community/
│   │   │   ├── directory/
│   │   │   ├── member/
│   │   │   └── network/
│   │   ├── (premium)/         ← 정회원 이상
│   │   │   └── resources/
│   │   ├── (admin)/           ← 관리자 전용
│   │   │   └── admin/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── complete-profile/
│   │   └── api/
│   │       ├── auth/          ← NextAuth 핸들러
│   │       ├── admin/
│   │       ├── member/
│   │       ├── organizations/
│   │       ├── posts/
│   │       ├── resources/
│   │       ├── cron/
│   │       ├── events/
│   │       ├── health/
│   │       └── stories/
│   ├── auth.config.ts
│   ├── proxy.ts
│   ├── components/
│   │   ├── ui/                ← 공통 UI 컴포넌트
│   │   │   └── Badge.tsx
│   │   ├── layout/            ← 헤더, 푸터, 사이드바
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/              ← 로그인, 가입 폼
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   └── FieldError.tsx
│   │   ├── directory/         ← 단체 지도, 카드
│   │   │   ├── OrganizationCard.tsx
│   │   │   ├── MapComponent.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── OrganizationRegisterForm.tsx
│   │   ├── community/         ← 게시판 컴포넌트
│   │   │   ├── CommunityTabs.tsx
│   │   │   ├── PostCard.tsx
│   │   │   └── WritePostForm.tsx
│   │   ├── resources/         ← 자료실 컴포넌트
│   │   │   └── ResourceList.tsx
│   │   ├── admin/             ← 관리자 컴포넌트
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── MemberRoleForm.tsx
│   │   │   ├── OrgApproveForm.tsx
│   │   │   ├── CategoryOfficerForm.tsx
│   │   │   ├── ResourceAdminForm.tsx
│   │   │   ├── EventForm.tsx
│   │   │   ├── StoryForm.tsx
│   │   │   └── DeleteButton.tsx
│   │   ├── home/              ← 홈페이지 컴포넌트
│   │   │   └── HeroCarousel.tsx
│   │   ├── story/             ← 스토리 컴포넌트
│   │   │   ├── StoryCard.tsx
│   │   │   └── VideoEmbed.tsx
│   │   └── Providers.tsx
│   ├── lib/
│   │   ├── supabase.ts        ← Supabase 클라이언트
│   │   ├── prisma.ts          ← Prisma 클라이언트
│   │   ├── auth.ts            ← NextAuth 설정
│   │   ├── email.ts           ← 이메일 발송
│   │   ├── env.ts             ← 환경변수 검증
│   │   ├── utils.ts           ← 공통 유틸
│   │   ├── eventTypes.ts      ← 이벤트 타입 정의
│   │   ├── rateLimit.ts       ← API 속도 제한
│   │   └── videoUtils.ts      ← 비디오 유틸리티
│   ├── schemas/               ← Zod 스키마 (검증 규칙)
│   │   ├── auth.schema.ts     ← 로그인·가입 검증
│   │   ├── env.schema.ts      ← 환경변수 검증
│   │   ├── member.schema.ts   ← 회원 정보 검증
│   │   ├── organization.schema.ts ← 단체 등록 검증
│   │   ├── post.schema.ts     ← 게시글 검증
│   │   └── resource.schema.ts ← 자료 등록 검증
│   ├── types/
│   │   └── index.ts           ← 전역 TypeScript 타입
│   ├── workers/               ← Cloudflare Workers
│   │   ├── cron.ts            ← 크론 작업
│   │   └── tsconfig.json
│   └── kima_logo.png
├── tests/
│   ├── setup.ts               ← 테스트 설정
│   ├── unit/                  ← Vitest 단위 테스트
│   │   ├── schemas/           ← Zod 스키마 테스트
│   │   └── utils/             ← 유틸 함수 테스트
│   ├── components/            ← Testing Library 컴포넌트 테스트
│   │   ├── auth/
│   │   └── directory/
│   └── e2e/                   ← Playwright E2E 테스트
│       ├── auth.spec.ts       ← 로그인·가입 시나리오
│       ├── member.spec.ts     ← 회원 등급 접근 제어
│       ├── admin.spec.ts      ← 관리자 승인 시나리오
│       ├── fixtures.ts        ← 테스트 픽스처
│       └── helpers.ts         ← 테스트 헬퍼
├── tsconfig.json
├── vitest.config.ts           ← 단위·컴포넌트 테스트 설정
└── wrangler.toml             ← Cloudflare Workers 설정
```

---

## 환경변수 (.env.local)

```env
# 사이트
NEXT_PUBLIC_SITE_URL=https://kima2019.org

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# NextAuth
NEXTAUTH_URL=https://kima2019.org
NEXTAUTH_SECRET=                        # openssl rand -base64 32

# 구글 OAuth (9단계에서 입력)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# 카카오 OAuth (9단계에서 입력)
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# 네이버 OAuth (9단계에서 입력)
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# 구글 Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# 이메일 (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@kima2019.org
SMTP_PASSWORD=

# 관리자 이메일
ADMIN_EMAIL=admin@kima2019.org
```

> 규칙: NEXT_PUBLIC_ 접두사 = 브라우저 노출 가능. 나머지는 서버 전용.

---

## 데이터베이스 스키마 (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 회원
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  role          UserRole  @default(MEMBER)        // MEMBER | PREMIUM | OFFICER | ADMIN
  organization  String?                           // 소속 단체
  region        String?                           // 지역
  phone         String?
  approvedAt    DateTime?                         // 정회원 승인일
  expiresAt     DateTime?                         // 정회원 만료일 (가입일+1년)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  premiumNote   String?                           // 관리자 납부 메모
}

enum UserRole {
  MEMBER     // 일반회원 (무료)
  PREMIUM    // 정회원 (연 5만원)
  OFFICER    // 임원·위원장
  ADMIN      // 관리자
}

// NextAuth 계정 연동
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String                        // google | kakao | naver | credentials
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 회원단체 디렉토리
model Organization {
  id           String   @id @default(cuid())
  name         String
  nameEn       String?
  description  String?
  region       String                            // 지역 (서울경기인천 | 부산경남 | ...)
  languages    String[]                          // 언어권 (베트남 | 네팔 | ...)
  targets      String[]                          // 사역대상 (노동자 | 유학생 | ...)
  type         String?                           // 사역유형 (교회 | NGO | 법률 | ...)
  address      String?
  lat          Float?                            // 위도
  lng          Float?                            // 경도
  phone        String?
  email        String?
  website      String?
  isPublic     Boolean  @default(false)          // 관리자 승인 후 공개
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// 카테고리 (지역별 | 언어권별 | 사역대상별)
model Category {
  id          String   @id @default(cuid())
  type        CategoryType                       // REGION | LANGUAGE | TARGET
  name        String                             // 표시 이름
  slug        String   @unique                   // URL용 (seoul | vietnam | worker)
  order       Int      @default(0)
  officerName String?                            // 담당 위원장 이름
  officerSns  String?                            // SNS 아이디 (카카오 등)
  officerQr   String?                            // QR코드 이미지 URL
  createdAt   DateTime @default(now())

  posts       Post[]
  resources   Resource[]
}

enum CategoryType {
  REGION    // 지역별
  LANGUAGE  // 언어권별
  TARGET    // 사역대상별
}

// 게시판 게시글 (공지·사역나눔)
model Post {
  id          String      @id @default(cuid())
  title       String
  content     String
  type        PostType    @default(SHARE)        // NOTICE | SHARE
  categoryId  String
  category    Category    @relation(fields: [categoryId], references: [id])
  authorId    String
  author      User        @relation(fields: [authorId], references: [id])
  isPublished Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum PostType {
  NOTICE  // 공지 (임원·위원장만 작성)
  SHARE   // 사역 나눔 (임원·위원장만 작성)
}

// 자료실 (구글 드라이브 링크)
model Resource {
  id           String       @id @default(cuid())
  title        String
  description  String?
  driveUrl     String                            // 구글 드라이브 링크
  fileType     String?                           // PDF | PPT | DOC | ...
  accessLevel  AccessLevel  @default(MEMBER)     // PUBLIC | MEMBER | PREMIUM
  categoryId   String?
  category     Category?    @relation(fields: [categoryId], references: [id])
  uploadedById String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

enum AccessLevel {
  PUBLIC   // 누구나
  MEMBER   // 일반회원 이상
  PREMIUM  // 정회원 이상
}

// 리스닝콜·포럼 일정
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        String                             // LISTENING_CALL | FORUM
  scheduledAt DateTime
  zoomUrl     String?                            // 로그인 회원만 표시
  maxAttendees Int?
  createdAt   DateTime @default(now())

  attendees   EventAttendee[]
}

// 행사 참석 신청
model EventAttendee {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id])
  name      String
  email     String
  phone     String?
  createdAt DateTime @default(now())

  @@unique([eventId, email])
}
```

---

## 회원 등급별 접근 제어

### 미들웨어 규칙 (src/middleware.ts)

```
경로 접근 규칙:
/                     → 모두 접근 가능
/about/*              → 모두 접근 가능
/directory/*          → 모두 접근 가능 (연락처 상세는 일반회원 이상)
/story/*              → 모두 접근 가능
/data/*               → 모두 접근 가능
/donate               → 모두 접근 가능
/privacy, /terms      → 모두 접근 가능

/community/*          → 누구나 읽기 가능 / 글쓰기·수정은 로그인 필요
/network/*            → 누구나 읽기 가능 / 수정은 로그인 필요

/resources/*          → 정회원(PREMIUM) 이상 → 미충족 시 /member/upgrade
/community/*/premium  → 정회원(PREMIUM) 이상

/admin/*              → 임원(OFFICER) 이상 → 미충족 시 /
/admin/organizations  → 관리자(ADMIN) 전용
/admin/categories     → 관리자(ADMIN) 전용 (API 기준)
/admin/resources      → 관리자(ADMIN) 전용 (API 기준)
/admin/email          → 관리자(ADMIN) 전용 (API 기준)
/admin/popups         → 관리자(ADMIN) 전용 (API 기준)

역할 계층: ADMIN > OFFICER > PREMIUM > MEMBER
```

---

## 페이지별 구현 명세

### 1. 홈 (/)

```
섹션 구성:
1. 히어로 — 슬로건 + CTA 2개 (단체 등록하기 / 후원하기)
2. 숫자 카운터 — 이주민 280만 / 등록 단체 N개 / 리스닝콜 N회
3. 4대 비전 카드 — CONNECT / DATA / STORY / FUND
4. 최신 스토리 — 최근 게시글 3개 썸네일
5. 다음 일정 — 가장 가까운 이벤트 1개
6. 후원 배너 — 계좌 정보 CTA
7. 협력 기관 로고
```

### 2. 회원 디렉토리 (/directory)

```
/directory
  - 전국 지도 (Google Maps) + 단체 카드 목록 병렬 표시
  - 필터: 언어권 | 지역 | 사역대상 | 사역유형

/directory/[id]
  - 단체 상세 (연락처는 일반회원 로그인 후 표시)
  - 협력 요청 버튼 → 담당 위원장 연락으로 연결
```

### 3. 카테고리 커뮤니티 (/community)

```
3개 탭: 지역별 | 언어권별 | 사역대상별

각 카테고리 페이지 (/community/[type]/[slug]):
  - 공지 게시판 (읽기: 일반회원 / 쓰기: OFFICER 이상)
  - 자료실 (일반자료: MEMBER / 정회원자료: PREMIUM)
  - 사역 나눔 (읽기: MEMBER / 쓰기: OFFICER 이상)
  - 담당자 연락 섹션:
      위원장 이름 + SNS 아이디 + QR코드 이미지
      보안 문의는 이 채널로 직접 연락 안내
```

### 4. 자료실 (/resources) — 정회원 전용

```
카테고리별 자료 목록:
  - 비자·법률 / 의료·복지 / 보조금·공모 / 선교·훈련
  - 각 자료: 제목 | 등록일 | 파일형식 | 구글드라이브 링크
  - 접근등급 배지 표시 (공개 / 회원 / 정회원)
```

### 5. 후원 (/donate) — 1단계

```
계좌 정보만 표시:
  은행: 국민은행
  계좌: 263101-04-561156
  예금주: 이창호 (한국이주민선교연합회)

  입금 후 안내:
  성함·금액·용도를 admin@kima2019.org 또는
  카카오톡 [사무국 ID]로 알려주세요.

  기부금 영수증: 비영리단체 등록 완료 후 발급 예정

2단계 (비영리 등록 완료 후):
  카카오페이 / MissionFund 연동
```

### 6. 관리자 (/admin)

```
/admin/members
  - 전체 회원 목록
  - 필터: 등급 | 가입일 | 납부여부
  - 정회원 신청 대기 탭 (별도 강조)
  - 각 회원 행: 등급 변경 버튼 + 납부 메모 입력

/admin/organizations
  - 단체 등록 신청 목록
  - 승인 / 반려 버튼

/admin/categories
  - 카테고리별 위원장 정보 관리
  - SNS 아이디 / QR코드 업로드

/admin/resources
  - 자료 링크 등록 / 수정 / 삭제
  - 접근등급 설정

/admin/events
  - 리스닝콜·포럼 일정 등록
```

---

## 이메일 자동화 명세

| 트리거 | 수신자 | 제목 | 내용 |
|--------|--------|------|------|
| 가입 완료 | 신규 회원 | KIMA 가입을 환영합니다 | 환영 + 정회원 안내 |
| 정회원 승인 | 해당 회원 | 정회원 승인이 완료되었습니다 | 승인 완료 + 접근 가능 콘텐츠 |
| 정회원 만료 D-30 | 정회원 | 정회원 갱신 안내 | 갱신 안내 + 계좌 정보 |
| 단체 등록 승인 | 신청자 | 단체 등록이 완료되었습니다 | 디렉토리 등재 완료 |
| 행사 신청 완료 | 신청자 | 참석 신청이 완료되었습니다 | 일정 + Zoom 링크 |
| 행사 D-3 리마인더 | 신청자 | [KIMA] 리스닝콜 3일 전 안내 | 일정 + Zoom 링크 재안내 |

---

## UI 디자인 가이드

```
색상 (CI 기준 — 확정 전 임시):
  Primary:   #1B3A6B  (네이비)
  Secondary: #C8922A  (골드)
  Background:#F8F9FA
  Text:      #1A1A1A

폰트:
  한국어: Noto Sans KR
  영어:   Inter
  제목:   font-weight 700
  본문:   font-weight 400, line-height 1.7

반응형 브레이크포인트 (Tailwind 기본):
  sm:  640px   (모바일 가로)
  md:  768px   (태블릿)
  lg:  1024px  (소형 데스크탑)
  xl:  1280px  (데스크탑)

모바일 퍼스트 작성 — 카카오톡 인앱 브라우저 대응 필수
```

---

## 개발 단계별 프롬프트

아래 각 단계를 순서대로 Claude Code에 지시합니다.
각 프롬프트는 독립적으로 사용 가능하며, 이전 단계 완료 후 다음 단계로 진행합니다.

---

### STEP 1 — 프로젝트 초기화

```
이 CLAUDE.md 파일을 읽고 프로젝트를 초기화해줘.

수행할 작업:
1. Next.js 14 App Router + TypeScript 프로젝트 생성
   명령어: npx create-next-app@latest kima-website --typescript --tailwind --app --src-dir --import-alias "@/*"

2. 추가 패키지 설치:
   npm install @prisma/client prisma
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install next-auth@beta
   npm install nodemailer
   npm install zod
   npm install react-hook-form @hookform/resolvers
   npm install @types/nodemailer -D

3. 테스트 패키지 설치:
   npm install -D vitest @vitejs/plugin-react jsdom
   npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
   npm install -D @playwright/test
   npx playwright install

4. Cloudflare 패키지 설치:
   npm install -D @cloudflare/next-on-pages wrangler

5. vitest.config.ts 생성:
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       setupFiles: ['./tests/setup.ts'],
       globals: true,
     },
   })

6. tests/setup.ts 생성:
   import '@testing-library/jest-dom'

7. playwright.config.ts 생성:
   baseURL: 'http://localhost:3000'
   테스트 파일 위치: tests/e2e/**/*.spec.ts
   브라우저: chromium (기본), 필요시 firefox 추가

8. .gitignore에 추가:
   .env.local
   .env*.local
   /tests/e2e/screenshots
   /playwright-report

9. .env.example 파일 생성 (CLAUDE.md의 환경변수 섹션 참고, 값은 비워둠)

10. CLAUDE.md의 디렉토리 구조대로 폴더와 빈 파일 생성
    (schemas/ 폴더와 tests/ 폴더 포함)

11. prisma/schema.prisma 파일을 CLAUDE.md의 스키마로 작성

12. package.json scripts에 추가:
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "build:cf": "npx @cloudflare/next-on-pages"

결과물 확인:
- next.config.ts 에 이미지 도메인 설정 (drive.google.com 포함)
- tailwind.config.ts 에 Noto Sans KR 폰트 설정
- src/app/layout.tsx 에 기본 메타데이터 (title: "KIMA | 한국이주민선교연합회", description: "연결하고 기록하고 보이게 하고 후원으로 이어주는 전국 다문화사역 연합 플랫폼")
```

---

### STEP 2 — Supabase + Prisma 연결

```
CLAUDE.md를 참고해서 Supabase와 Prisma를 설정해줘.

수행할 작업:
1. src/lib/supabase.ts 생성
   - createClient (브라우저용)
   - createServerClient (서버 컴포넌트용)

2. src/lib/prisma.ts 생성
   - PrismaClient 싱글톤 패턴

3. Supabase 프로젝트 연결 안내 출력:
   - supabase.com에서 프로젝트 생성 후
   - .env.local에 SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY 입력 방법 주석으로 안내

4. prisma/schema.prisma의 DATABASE_URL을
   Supabase 연결 문자열 형식으로 주석 안내
   형식: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

5. 연결 테스트용 API Route 생성:
   src/app/api/health/route.ts
   GET 요청 시 { status: "ok", db: "connected" } 반환
   (Prisma로 User 테이블 count 쿼리)
```

---

### STEP 2.5 — Zod 스키마 및 검증 시스템

```
CLAUDE.md의 schemas/ 폴더 구조를 참고해서 Zod 검증 스키마를 작성해줘.
이 스키마는 폼 검증(React Hook Form)과 API 요청 검증 양쪽에서 공유해서 사용한다.

수행할 작업:

1. src/schemas/auth.schema.ts
   - loginSchema:
     email: 이메일 형식 필수
     password: 최소 8자 필수
   - registerSchema:
     name: 최소 2자, 최대 50자
     email: 이메일 형식 필수
     password: 최소 8자, 영문+숫자 조합
     passwordConfirm: password와 일치 확인 (.refine)
     organization: 선택, 최대 100자
   - 에러 메시지 한국어로 작성
     예: z.string().min(2, '이름은 2자 이상 입력해주세요')

2. src/schemas/member.schema.ts
   - updateProfileSchema:
     name: 최소 2자
     organization: 선택
     region: 선택 (열거형: 서울경기인천 | 부산경남 | ...)
     phone: 선택, 한국 전화번호 형식 (010-XXXX-XXXX)
   - premiumRequestSchema:
     depositorName: 입금자명 필수
     depositedAt: 날짜 필수

3. src/schemas/organization.schema.ts
   - organizationSchema:
     name: 필수, 최대 100자
     nameEn: 선택, 영문만
     description: 선택, 최대 500자
     region: 필수 (열거형)
     languages: 배열, 최소 1개 선택
     targets: 배열, 최소 1개 선택
     address: 선택
     phone: 선택, 전화번호 형식
     email: 선택, 이메일 형식
     website: 선택, URL 형식

4. src/schemas/post.schema.ts
   - postSchema:
     title: 필수, 최소 2자, 최대 200자
     content: 필수, 최소 10자
     type: 열거형 (NOTICE | SHARE)
     categoryId: 필수, cuid 형식

5. src/schemas/resource.schema.ts
   - resourceSchema:
     title: 필수, 최대 200자
     description: 선택, 최대 500자
     driveUrl: 필수, URL 형식, drive.google.com 도메인 검증
     fileType: 선택 (PDF | PPT | DOC | XLS | ETC)
     accessLevel: 열거형 (PUBLIC | MEMBER | PREMIUM)
     categoryId: 선택

6. src/schemas/env.schema.ts — 환경변수 검증
   서버 시작 시 필수 환경변수가 없으면 즉시 에러 출력:
   const envSchema = z.object({
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXTAUTH_SECRET: z.string().min(32),
     SMTP_HOST: z.string(),
     ADMIN_EMAIL: z.string().email(),
     // ...
   })
   src/lib/env.ts에서 앱 시작 시 한 번 파싱 후 내보내기

7. 테스트 작성: tests/unit/schemas/auth.schema.test.ts
   - 유효한 입력값 통과 테스트
   - 이메일 형식 오류 테스트
   - 비밀번호 불일치 테스트
   - 한국어 에러 메시지 출력 확인 테스트
```

---

### STEP 3 — 인증 시스템 (이메일 가입·로그인)

```
CLAUDE.md를 참고해서 NextAuth.js로 이메일 인증을 구현해줘.
소셜 로그인(구글·카카오·네이버)은 나중에 추가할 예정이니
지금은 이메일+비밀번호 방식만 구현해줘.
폼은 React Hook Form + Zod를 사용해서 검증해줘.

수행할 작업:
1. src/lib/auth.ts — NextAuth 설정
   - Credentials Provider (이메일+비밀번호)
   - bcrypt로 비밀번호 해싱
   - 세션에 user.id, user.role 포함
   - Prisma Adapter 연결

2. src/app/api/auth/[...nextauth]/route.ts 생성

3. src/middleware.ts — 라우트 보호
   CLAUDE.md의 "미들웨어 규칙" 참고
   - /community/* → MEMBER 이상 필요
   - /resources/* → PREMIUM 이상 필요
   - /admin/* → ADMIN 전용
   - 미충족 시 리디렉션 처리

4. src/app/auth/register/page.tsx — 회원가입 폼
   React Hook Form + zodResolver(registerSchema) 사용:
   - useForm에 registerSchema 연결
   - 각 필드 register() 적용
   - errors 객체로 필드별 에러 메시지 표시
   - isSubmitting 상태로 제출 중 버튼 비활성화
   입력: 이름 / 이메일 / 비밀번호 / 비밀번호 확인 / 소속단체(선택)
   가입 완료 → 환영 이메일 발송 → /auth/login으로 이동

5. src/app/auth/login/page.tsx — 로그인 폼
   React Hook Form + zodResolver(loginSchema) 사용
   이메일 + 비밀번호
   하단에 "소셜 로그인은 준비 중입니다" 안내 (나중에 버튼으로 교체 예정)

6. src/app/api/auth/register/route.ts — 회원가입 API
   - 요청 body를 registerSchema로 파싱 (safeParse 사용)
   - 검증 실패 시 400 + 에러 상세 반환
   - 이메일 중복 확인
   - 비밀번호 bcrypt 해싱
   - User 생성 (role: MEMBER 기본값)
   - 환영 이메일 발송

7. src/components/auth/ 폴더에 재사용 컴포넌트:
   - LoginForm.tsx  (React Hook Form 적용)
   - RegisterForm.tsx (React Hook Form 적용)
   - AuthGuard.tsx (권한 부족 시 안내 UI)
   - FieldError.tsx (Zod 에러 메시지 표시 공통 컴포넌트)

8. 테스트 작성:
   tests/components/auth/RegisterForm.test.tsx
   - 빈 폼 제출 시 에러 메시지 표시 확인
   - 이메일 형식 오류 메시지 확인
   - 비밀번호 불일치 메시지 확인
   - 유효한 입력 후 제출 시 API 호출 확인
   (msw 또는 jest.mock으로 API 모킹)

   tests/e2e/auth.spec.ts
   - 회원가입 전체 플로우 (입력 → 제출 → 리디렉트)
   - 로그인 성공 플로우
   - 잘못된 비밀번호 로그인 실패 메시지 확인
   - 비로그인 상태에서 /community 접근 → 로그인 페이지 리디렉트 확인
```

---

### STEP 4 — 공통 레이아웃·UI

```
CLAUDE.md의 디자인 가이드를 참고해서 공통 레이아웃을 만들어줘.

수행할 작업:
1. src/components/layout/Header.tsx
   - 로고 (텍스트 로고, 나중에 이미지로 교체)
   - 네비게이션: 소개 | 디렉토리 | 커뮤니티 | 스토리 | 데이터 | 후원
   - 우측: 로그인/회원가입 또는 프로필 드롭다운
   - 모바일: 햄버거 메뉴
   - 정회원 뱃지 표시 (로그인 시)

2. src/components/layout/Footer.tsx
   - 단체명, 주소, 연락처
   - 개인정보처리방침 | 이용약관 링크
   - 저작권

3. src/components/ui/ — 공통 컴포넌트
   - Button.tsx (variant: primary | secondary | outline)
   - Card.tsx
   - Badge.tsx (variant: member | premium | officer | admin)
   - Modal.tsx
   - LoadingSpinner.tsx
   - EmptyState.tsx

4. src/app/layout.tsx 업데이트
   - Header, Footer 포함
   - Noto Sans KR 폰트 적용
   - 기본 메타데이터

5. src/app/page.tsx — 홈페이지
   CLAUDE.md의 홈 섹션 구성 참고:
   - 히어로 섹션
   - 숫자 카운터 (애니메이션)
   - 4대 비전 카드 (CONNECT/DATA/STORY/FUND)
   - 최신 스토리 3개 (DB에서 가져오기)
   - 다음 일정 1개
   - 후원 배너
   색상: primary #1B3A6B, accent #C8922A
```

---

### STEP 5 — 회원 디렉토리 + 지도

```
CLAUDE.md를 참고해서 전국 사역 단체 디렉토리와 지도를 구현해줘.

수행할 작업:
1. src/app/(public)/directory/page.tsx
   - 좌측: Google Maps (단체 위치 마커)
   - 우측: 단체 카드 목록
   - 필터 바: 언어권 | 지역 | 사역대상
   - 지도 마커 클릭 → 해당 단체 카드 하이라이트

2. src/app/(public)/directory/[id]/page.tsx
   - 단체 상세 정보
   - 연락처: 로그인한 일반회원 이상만 표시
     (미로그인 시 "연락처 확인은 회원 로그인 후 가능합니다" 표시)

3. src/app/api/organizations/route.ts
   - GET: 필터 파라미터(region, language, target) 지원
   - POST: 단체 등록 신청 (로그인 필요, isPublic: false로 저장)

4. src/components/directory/
   - MapComponent.tsx (Google Maps API, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 사용)
   - OrganizationCard.tsx
   - FilterBar.tsx

5. 단체 등록 신청 폼 (로그인 필요):
   src/app/(member)/directory/register/page.tsx
   입력: 단체명 | 지역 | 언어권(복수) | 사역대상(복수) | 주소 | 연락처 | 소개
   제출 후 "검토 후 등록됩니다" 안내

주의:
- 구글 맵 API 키는 .env.local의 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 사용
- 지도 컴포넌트는 'use client' 필수
- 서버 컴포넌트에서 초기 데이터 fetch 후 클라이언트로 전달
```

---

### STEP 6 — 카테고리 게시판

```
CLAUDE.md를 참고해서 3축 카테고리 게시판을 구현해줘.

카테고리 종류:
  지역별: 서울경기인천 | 부산경남 | 대구경북 | 광주전라 | 대전충청 | 강원제주
  언어권별: 베트남 | 네팔 | 몽골 | 인도네시아 | 필리핀 | 러시아 | 중국 | 태국 | 기타
  사역대상별: 이주노동자 | 유학생 | 결혼이민자 | 다문화자녀 | 난민미등록 | 귀국이주민

수행할 작업:
1. src/app/(member)/community/page.tsx
   - 3개 탭: 지역별 | 언어권별 | 사역대상별
   - 각 탭에 카테고리 카드 그리드

2. src/app/(member)/community/[type]/[slug]/page.tsx
   - 상단: 카테고리 이름 + 담당 위원장 연락 섹션
     (위원장 이름 + SNS 아이디 + QR코드 이미지)
     ("보안이 필요한 문의는 담당 위원장에게 직접 연락해 주세요" 안내)
   - 공지 게시판 (PostType.NOTICE)
   - 사역 나눔 게시판 (PostType.SHARE)
   - 자료 목록 (이 카테고리에 속한 Resource 목록)
     접근등급별 표시:
       PUBLIC → 자물쇠 없음
       MEMBER → 파란 자물쇠 (로그인 필요)
       PREMIUM → 금색 자물쇠 (정회원 필요)

3. 게시글 작성 (OFFICER 이상만 가능):
   src/app/(member)/community/[type]/[slug]/write/page.tsx
   - 권한 체크: role이 OFFICER 또는 ADMIN이 아니면 접근 불가
   - 제목 | 내용(마크다운) | 유형(공지/나눔) 입력

4. src/app/api/posts/route.ts
   - GET: categoryId로 필터, type으로 필터
   - POST: OFFICER 이상만 허용

5. Seed 데이터:
   src/prisma/seed.ts
   위 카테고리 목록을 Category 테이블에 초기 데이터로 삽입
   명령어: npx prisma db seed
```

---

### STEP 7 — 자료실 (정회원 전용)

```
CLAUDE.md를 참고해서 자료실을 구현해줘.

수행할 작업:
1. src/app/(premium)/resources/page.tsx
   - 정회원 미만 접근 시: 정회원 안내 페이지로 이동
   - 카테고리 탭: 비자법률 | 의료복지 | 보조금공모 | 선교훈련
   - 각 자료 행: 제목 | 등록일 | 파일형식 뱃지 | 접근등급 뱃지 | 구글드라이브 링크

2. src/app/api/resources/route.ts
   - GET: 로그인 사용자의 role에 따라 accessLevel 필터
     MEMBER → PUBLIC + MEMBER 자료만
     PREMIUM 이상 → 전체
   - POST: OFFICER 이상만 자료 등록 가능

3. 자료 접근 로직:
   - PUBLIC: 링크 바로 표시
   - MEMBER: 일반회원 로그인 확인 후 링크 표시
   - PREMIUM: 정회원 확인 후 링크 표시
              미정회원에게는 "정회원 전용 자료입니다. 정회원 신청 →" 표시

4. src/components/resources/ResourceList.tsx
   - 접근등급에 따른 자물쇠 아이콘 표시
   - 구글 드라이브 링크 새 탭 열기

주의:
- 구글 드라이브 링크 자체가 공개 URL이면 로그인 없이도 열림
- 따라서 정회원 자료의 드라이브 폴더 공유 설정을
  "링크가 있는 모든 사용자" → "특정 사용자만"으로 변경 안내 주석 추가
- 현재는 링크 노출 자체를 권한으로 제어
```

---

### STEP 8 — 관리자 페이지

```
CLAUDE.md를 참고해서 관리자 페이지를 구현해줘.

수행할 작업:
1. src/app/(admin)/admin/layout.tsx
   - ADMIN role 확인, 미충족 시 / 로 리디렉트
   - 관리자 사이드바 네비게이션

2. src/app/(admin)/admin/members/page.tsx
   - 전체 회원 테이블 (이름 | 이메일 | 등급 | 가입일 | 납부메모)
   - 상단 탭: 전체 | 정회원신청대기 (role이 MEMBER이고 premiumNote에 신청 메모 있는 사람)
   - 각 행에 등급 변경 드롭다운: MEMBER | PREMIUM | OFFICER | ADMIN
   - 납부 메모 입력 인라인 편집
   - 등급 변경 시 자동으로 승인 이메일 발송

3. src/app/(admin)/admin/organizations/page.tsx
   - 단체 승인 대기 목록 (isPublic: false)
   - 승인 버튼 → isPublic: true 변환 + 신청자에게 이메일
   - 반려 버튼 + 사유 입력

4. src/app/(admin)/admin/categories/page.tsx
   - 카테고리 목록
   - 각 카테고리의 위원장 정보 편집:
     위원장 이름 | SNS 아이디 | QR코드 이미지 업로드

5. src/app/(admin)/admin/resources/page.tsx
   - 자료 링크 목록 + 등록
   - 제목 | 드라이브 URL | 파일형식 | 접근등급 | 카테고리

6. src/app/(admin)/admin/events/page.tsx
   - 리스닝콜·포럼 일정 등록·관리
   - 참석 신청자 목록 확인

7. src/app/api/admin/ 하위 API Routes:
   - members/[id]/role → PATCH (등급 변경)
   - organizations/[id]/approve → PATCH
   - resources/route → POST, DELETE
```

---

### STEP 9 — 이메일 자동화

```
CLAUDE.md의 이메일 자동화 명세를 참고해서 이메일 발송을 구현해줘.

수행할 작업:
1. src/lib/email.ts
   - nodemailer SMTP 설정 (.env의 SMTP_* 변수 사용)
   - sendEmail(to, subject, html) 공통 함수

2. src/lib/emailTemplates.ts
   각 트리거별 HTML 이메일 템플릿:
   - welcomeEmail(name) — 가입 환영
   - premiumApprovedEmail(name) — 정회원 승인
   - premiumExpiringEmail(name, expiresAt) — 만료 30일 전
   - organizationApprovedEmail(orgName) — 단체 등록 승인
   - eventRegisteredEmail(eventTitle, scheduledAt, zoomUrl) — 행사 신청 완료
   - eventReminderEmail(eventTitle, scheduledAt, zoomUrl) — D-3 리마인더
   모든 템플릿에 KIMA 로고 텍스트 + 네이비/골드 색상 적용

3. 만료 D-30 알림 자동화:
   src/app/api/cron/expiring-members/route.ts
   - GET 요청으로 트리거 (Vercel Cron Jobs 사용)
   - expiresAt이 30일 이내인 정회원 조회 → 이메일 발송
   vercel.json에 cron 설정:
   { "crons": [{ "path": "/api/cron/expiring-members", "schedule": "0 9 * * *" }] }

4. D-3 리마인더:
   src/app/api/cron/event-reminders/route.ts
   - 3일 후 예정된 행사 신청자 전체에게 리마인더 발송
```

---

### STEP 10 — 나머지 페이지

```
CLAUDE.md를 참고해서 남은 페이지들을 완성해줘.

수행할 작업:
1. src/app/(public)/about/ 섹션
   - page.tsx — KIMA 소개 메인
   - history/page.tsx — 설립 배경 + 1~3기 연표
   - vision/page.tsx — 4기 비전 + 6대 실행계획 인포그래픽
   - leadership/page.tsx — 임원단 소개 (사진 + 약력)
   - brand/page.tsx — CI 가이드 + 로고 다운로드

2. src/app/(public)/story/ 섹션
   - page.tsx — 스토리 목록 (텍스트 + 영상)
   - [id]/page.tsx — 스토리 상세

3. src/app/(public)/data/page.tsx
   - 기초통계 (차트 — recharts 사용)
   - 백서 다운로드 섹션

4. src/app/(public)/donate/page.tsx
   계좌 정보 표시 (CLAUDE.md 후원 명세 참고)
   - 국민은행 263101-04-561156 이창호(한국이주민선교연합회)
   - 입금 후 연락 안내
   - 기부금 영수증 예정 안내

5. src/app/(member)/network/ 섹션
   - page.tsx — 리스닝콜 소개
   - schedule/page.tsx — 일정 + 구글 폼 참석 신청 임베드
   - archive/page.tsx — 지난 포럼 자료

6. src/app/(public)/privacy/page.tsx — 개인정보처리방침
   src/app/(public)/terms/page.tsx — 이용약관

7. src/app/(member)/member/
   - upgrade/page.tsx — 정회원 신청 안내 (계좌 + 연락 방법)
   - mypage/page.tsx — 내 정보 + 등급 + 연동 계정 + 활동 이력
```

---

### STEP 10.5 — 테스트 코드 작성

```
CLAUDE.md를 참고해서 핵심 기능에 대한 테스트 코드를 작성해줘.
테스트 도구: Vitest + Testing Library (단위·컴포넌트), Playwright (E2E)

수행할 작업:

1. 단위 테스트 — Zod 스키마 (tests/unit/schemas/)
   auth.schema.test.ts:
   - 정상 입력값 통과 확인
   - 이메일 형식 오류 → 한국어 에러 메시지 확인
   - 비밀번호 8자 미만 → 에러 확인
   - 비밀번호 불일치 → 에러 확인

   organization.schema.test.ts:
   - languages 배열 빈 값 → 에러 확인
   - website URL 형식 오류 → 에러 확인
   - 드라이브 URL 아닌 값 → 에러 확인

2. 단위 테스트 — 유틸 함수 (tests/unit/utils/)
   utils.test.ts:
   - 날짜 포맷 함수 테스트
   - 전화번호 포맷 함수 테스트
   - 정회원 만료 여부 판단 함수 테스트
     (expiresAt이 과거 → false, 미래 → true)

3. 컴포넌트 테스트 (tests/components/)
   auth/RegisterForm.test.tsx:
   - 빈 폼 제출 → 각 필드 에러 메시지 표시
   - 이메일 형식 오류 입력 → 실시간 에러 표시
   - 비밀번호 불일치 → 확인 필드 에러 표시
   - 유효한 입력 후 제출 → onSubmit 콜백 호출
   - isSubmitting 상태 → 버튼 disabled + 로딩 표시

   directory/OrganizationCard.test.tsx:
   - 단체 정보 렌더링 확인
   - 비로그인 시 연락처 숨김 확인
   - 로그인 시 연락처 표시 확인

4. E2E 테스트 (tests/e2e/)
   auth.spec.ts:
   - 회원가입 성공 플로우:
     /auth/register → 폼 입력 → 제출 → /auth/login 리디렉트
   - 잘못된 이메일 형식 → 에러 메시지 표시 (페이지 이동 없음)
   - 로그인 성공 → 홈으로 이동
   - 잘못된 비밀번호 → "이메일 또는 비밀번호가 올바르지 않습니다" 표시

   member.spec.ts:
   - 비로그인 → /community 접근 → /auth/login 리디렉트
   - 일반회원 로그인 → /community 접근 성공
   - 일반회원 → /resources 접근 → 정회원 안내 페이지
   - 정회원 → /resources 접근 성공

   admin.spec.ts:
   - 관리자 로그인 → /admin 접근 성공
   - 일반회원 → /admin 접근 → 홈 리디렉트
   - 회원 등급 변경 플로우:
     /admin/members → 회원 선택 → PREMIUM 변경 → 성공 토스트 표시

5. 테스트 환경 설정:
   tests/e2e/fixtures.ts — 테스트용 계정 정보
   tests/e2e/helpers.ts — 로그인 헬퍼 함수 (반복 코드 제거)
   .env.test — 테스트용 환경변수 (테스트 DB URL 등)

6. package.json에 CI용 스크립트 추가:
   "test:all": "vitest run && playwright test"
   "test:coverage": "vitest run --coverage"
```

---

### STEP 11 — SEO·보안·최적화

```
CLAUDE.md를 참고해서 SEO, 보안, 성능 최적화를 적용해줘.

수행할 작업:
1. SEO
   - 각 페이지 generateMetadata() 함수 추가
   - Open Graph 태그 (카카오·페이스북 공유 미리보기)
   - src/app/sitemap.ts — 동적 사이트맵 생성
   - src/app/robots.ts — robots.txt (/admin 차단)

2. 보안
   - next.config.ts에 보안 헤더 추가:
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
   - API Route에 rate limiting 적용 (upstash/ratelimit 또는 자체 구현)
   - 관리자 API에 추가 인증 확인

3. 성능
   - next/image로 모든 이미지 최적화
   - 지도 컴포넌트 dynamic import (SSR 비활성화)
   - 무거운 컴포넌트 Suspense 처리

4. 백업
   - Supabase 자동 백업 활성화 안내 주석
   - Cloudflare Pages 환경변수 설정 가이드 주석

5. Cloudflare 보안 설정 안내 주석 추가:
   - WAF (Web Application Firewall) 활성화 권장
   - Bot Fight Mode 활성화
   - Security Level: Medium 권장
   - SSL/TLS: Full (strict) 모드 설정
```

---

### STEP 12 — Cloudflare Pages 배포 + 도메인 연결

```
Cloudflare Pages 배포와 kima2019.org 도메인 연결을 완료해줘.
배포 구조: 가비아(도메인 구매) → Cloudflare(네임서버·CDN·배포) → Supabase(DB)

수행할 작업:

1. Next.js를 Cloudflare Pages에 맞게 설정

   next.config.ts 수정:
   - output: 'standalone' 제거 (Cloudflare Pages는 Edge Runtime 사용)
   - 이미지 최적화: Cloudflare Images 또는 unoptimized: true 설정

   package.json에 빌드 스크립트 추가:
   "build:cf": "npx @cloudflare/next-on-pages"

   추가 패키지 설치:
   npm install -D @cloudflare/next-on-pages wrangler

2. wrangler.toml 생성 (프로젝트 루트):
   name = "kima-website"
   compatibility_date = "2024-01-01"
   compatibility_flags = ["nodejs_compat"]

   pages_build_output_dir = ".vercel/output/static"

3. Cloudflare Workers Cron 설정
   (Vercel Cron 대신 Cloudflare Workers로 구현)

   src/workers/cron-expiring-members.ts 생성:
   - 매일 오전 9시 실행
   - 만료 30일 이내 정회원 조회 → 이메일 발송
   - KIMA 사이트의 /api/cron/expiring-members 호출 방식으로 구현

   src/workers/cron-event-reminders.ts 생성:
   - 매일 오전 9시 실행
   - D-3 행사 신청자에게 리마인더 발송

   wrangler.toml에 Cron 트리거 추가:
   [[triggers.crons]]
   cron = "0 0 * * *"   # UTC 00:00 = KST 09:00

4. Cloudflare Pages 환경변수 설정 안내 주석
   (wrangler.toml에 직접 쓰지 말고 Cloudflare 대시보드에서 설정)
   설정 위치: Cloudflare 대시보드 → Pages → kima-website → Settings → Environment variables
   입력할 변수 목록: .env.example 파일의 모든 항목

5. _headers 파일 생성 (public/_headers):
   /*
     X-Frame-Options: DENY
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
     Permissions-Policy: camera=(), microphone=(), geolocation=()

   /admin/*
     X-Robots-Tag: noindex

6. _redirects 파일 생성 (public/_redirects):
   # www → non-www 리디렉트
   https://www.kima2019.org/* https://kima2019.org/:splat 301

7. DEPLOY_CHECKLIST.md 생성:

   === 1단계: 가비아 → Cloudflare 네임서버 위임 ===
   [ ] cloudflare.com 가입 후 사이트 추가: kima2019.org
   [ ] Cloudflare가 제시하는 네임서버 2개 확인
       예시: aria.ns.cloudflare.com / ken.ns.cloudflare.com
   [ ] 가비아 도메인 관리 → 네임서버 변경 → Cloudflare 네임서버 2개 입력
   [ ] Cloudflare 대시보드에서 네임서버 전파 확인 (최대 48시간, 보통 수분~수시간)

   === 2단계: Cloudflare DNS 레코드 설정 ===
   [ ] Cloudflare DNS → 레코드 추가:
       CNAME  @    kima-website.pages.dev   (프록시 ON)
       CNAME  www  kima2019.org             (프록시 ON)
   [ ] SSL/TLS → Overview → Full (strict) 선택
   [ ] SSL/TLS → Edge Certificates → Always Use HTTPS ON
   [ ] SSL/TLS → Edge Certificates → Minimum TLS Version: TLS 1.2

   === 3단계: Cloudflare 보안 설정 ===
   [ ] Security → WAF → 활성화
   [ ] Security → Bots → Bot Fight Mode ON
   [ ] Security → Settings → Security Level: Medium
   [ ] Speed → Optimization → Auto Minify: JS/CSS/HTML 모두 체크

   === 4단계: Cloudflare Pages 배포 ===
   [ ] Cloudflare 대시보드 → Workers & Pages → Create application → Pages
   [ ] GitHub 저장소 연결 (또는 Direct Upload)
   [ ] 빌드 설정:
       Framework preset: Next.js
       Build command: npx @cloudflare/next-on-pages
       Build output directory: .vercel/output/static
       Node.js version: 18.x
   [ ] Environment variables 탭에서 .env.example의 모든 변수 입력
   [ ] 배포 실행 → 도메인 kima2019.org 연결

   === 5단계: DB·서비스 설정 ===
   [ ] Supabase → Settings → API → Allowed origins에 https://kima2019.org 추가
   [ ] prisma db push 실행 (프로덕션 DB 스키마 적용)
   [ ] npx prisma db seed 실행 (카테고리 초기 데이터)
   [ ] 관리자 계정 수동 생성:
       Supabase 대시보드 → Table Editor → User 테이블
       또는 /api/admin/init 엔드포인트로 최초 1회 생성

   === 6단계: 최종 확인 ===
   [ ] https://kima2019.org 접속 확인 (HTTPS 자물쇠)
   [ ] https://www.kima2019.org → https://kima2019.org 리디렉트 확인
   [ ] 회원가입 → 이메일 수신 확인
   [ ] 관리자 로그인 (/admin) 확인
   [ ] 구글 Maps 도메인 제한 설정 (kima2019.org만 허용)
   [ ] Cloudflare Analytics → 트래픽 수집 확인

8. README.md 생성:
   - 로컬 개발 시작 방법
   - 환경변수 설정 방법
   - DB 마이그레이션 방법
   - Cloudflare Pages 배포 방법
   - 가비아 → Cloudflare 네임서버 위임 방법
```

---

### STEP 13 — 소셜 로그인 (마지막)

```
CLAUDE.md를 참고해서 소셜 로그인을 추가해줘.
각 플랫폼 앱 등록과 키 발급이 완료된 후 진행.

전제 조건:
- .env.local에 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 입력 완료
- .env.local에 KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET 입력 완료
- .env.local에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 입력 완료
- 카카오 비즈니스 앱 전환 완료 (이메일 수집 권한)

수행할 작업:
1. src/lib/auth.ts 업데이트
   기존 Credentials Provider에 추가:
   - GoogleProvider
   - KakaoProvider
   - NaverProvider (커스텀 구현 필요 — NextAuth 기본 미지원)

2. 네이버 커스텀 Provider:
   src/lib/naverProvider.ts
   authorization URL, token URL, userinfo URL 직접 정의

3. src/app/auth/login/page.tsx 업데이트
   "소셜 로그인은 준비 중입니다" 텍스트를 실제 버튼으로 교체:
   - 구글 로그인 버튼 (흰 배경 + 구글 색상)
   - 카카오 로그인 버튼 (노란 배경)
   - 네이버 로그인 버튼 (초록 배경)

4. 신규 소셜 가입 시 추가 정보 입력 처리:
   src/app/auth/complete-profile/page.tsx
   소셜 로그인 후 소속단체·지역 등 추가 입력 유도
   (이미 입력된 경우 스킵)

5. src/app/(member)/member/mypage/page.tsx 업데이트
   소셜 계정 연동 섹션 추가:
   - 현재 연동된 계정 표시
   - 연동/해제 버튼

6. 이메일 중복 처리:
   같은 이메일로 다른 provider 가입 시도 시
   "이미 [기존방법]으로 가입된 이메일입니다.
    로그인 후 마이페이지에서 소셜 계정을 연동해 주세요." 안내
```

---

## 개발 중 자주 쓸 명령어

```bash
# 로컬 개발 서버
npm run dev

# DB 스키마 변경 후 적용
npx prisma db push

# 초기 데이터 삽입
npx prisma db seed

# Prisma Client 재생성
npx prisma generate

# DB 상태 확인 (GUI)
npx prisma studio

# 단위·컴포넌트 테스트 (watch 모드)
npm run test

# 단위·컴포넌트 테스트 UI (브라우저)
npm run test:ui

# 단위·컴포넌트 테스트 커버리지
npm run test:coverage

# E2E 테스트 (headless)
npm run test:e2e

# E2E 테스트 UI (브라우저에서 시각적 확인)
npm run test:e2e:ui

# 전체 테스트 (CI용)
npm run test:all

# 빌드 테스트 (일반)
npm run build

# Cloudflare Pages 빌드 테스트
npm run build:cf

# Cloudflare Pages 로컬 미리보기
npx wrangler pages dev .vercel/output/static

# Cloudflare Workers 로컬 테스트
npx wrangler dev src/workers/cron-expiring-members.ts

# Cloudflare Pages 수동 배포 (CLI)
npx wrangler pages deploy .vercel/output/static --project-name=kima-website

# 타입 체크
npx tsc --noEmit
```

---

## 주의사항 (Claude Code에게)

1. 모든 API 키와 비밀값은 반드시 환경변수에서 읽을 것 (`process.env.변수명`)
2. `NEXT_PUBLIC_` 접두사는 브라우저에 노출되므로 비밀 키에 절대 사용 금지
3. 모든 API Route에서 세션 확인 후 권한 체크 필수
4. 정회원 여부 확인은 `user.role === 'PREMIUM'` 뿐 아니라 `expiresAt > new Date()` 도 함께 확인
5. 구글 드라이브 링크는 새 탭(`target="_blank"`)으로 열기
6. 모바일 퍼스트 — 모든 컴포넌트 모바일 레이아웃 먼저 작성
7. 한국어 텍스트 포함 시 Noto Sans KR 폰트 클래스 적용
8. `'use client'` 지시어는 반드시 필요한 컴포넌트에만 사용 (서버 컴포넌트 최대 활용)
9. 에러 처리 — 모든 API Route에 try/catch + 적절한 HTTP 상태코드 반환
10. TypeScript strict 모드 — `any` 타입 사용 금지

11. Zod 검증 규칙:
    - 모든 폼은 React Hook Form + zodResolver 조합으로 구현
    - 모든 API Route 요청 body는 schema.safeParse()로 먼저 검증
    - safeParse 실패 시 즉시 400 반환, error.format()으로 상세 에러 전달
    - 에러 메시지는 반드시 한국어로 작성
    - 클라이언트(폼)와 서버(API) 양쪽에서 같은 Zod 스키마 공유

12. 테스트 규칙:
    - 새 Zod 스키마 작성 시 → 반드시 단위 테스트 함께 작성
    - 새 폼 컴포넌트 작성 시 → Testing Library 테스트 함께 작성
    - 핵심 사용자 플로우(가입·로그인·등급 변경) → E2E 테스트로 커버
    - 테스트 파일은 구현 파일과 같은 폴더 구조로 tests/ 아래에 위치
    - `npm run test:all` 이 통과해야 배포 진행
