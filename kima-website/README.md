# KIMA 홈페이지

**한국이주민선교연합회 (Korea Immigrant Mission Alliance)** 공식 홈페이지

> 연결하고 · 기록하고 · 보이게 하고 · 후원으로 이어주는 전국 이주민 사역 연합 플랫폼

- 도메인: [kima2019.org](https://kima2019.org)
- 배포: Cloudflare Pages
- DB: Supabase (PostgreSQL)

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 |
| 스타일 | Tailwind CSS 4 |
| 인증 | NextAuth.js v5 (Credentials + OAuth 예정) |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| DB | Supabase (PostgreSQL) |
| 검증 | Zod 4 + React Hook Form |
| 배포 | Cloudflare Pages (`@cloudflare/next-on-pages`) |
| Cron | Cloudflare Workers |

---

## 로컬 개발 시작

### 1. 패키지 설치
```bash
cd kima-website
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 열어 Supabase 연결 정보 등 입력
```

주요 환경변수:
```env
DATABASE_URL=postgresql://postgres:[PW]@db.[REF].supabase.co:5432/postgres
NEXTAUTH_SECRET=[openssl rand -base64 32 결과]
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@kima2019.org
SMTP_PASSWORD=[Gmail 앱 비밀번호]
ADMIN_EMAIL=admin@kima2019.org
```

### 3. DB 스키마 적용 및 초기 데이터
```bash
npm run db:push    # 스키마 적용
npm run db:seed    # 카테고리 초기 데이터 (지역·언어권·사역대상)
```

### 4. 개발 서버 시작
```bash
npm run dev
# http://localhost:3000
```

---

## 주요 명령어

```bash
# 개발
npm run dev              # 개발 서버 (http://localhost:3000)

# DB
npm run db:push          # Prisma 스키마 → Supabase 적용
npm run db:seed          # 초기 데이터 삽입
npm run db:generate      # Prisma Client 재생성
npm run db:studio        # Prisma Studio GUI (http://localhost:5555)

# 테스트
npm run test             # Vitest (watch 모드)
npm run test:coverage    # 커버리지 포함
npm run test:e2e         # Playwright E2E
npm run test:all         # 전체 테스트 (CI용)

# 빌드
npm run build            # 일반 빌드
npm run build:cf         # Cloudflare Pages 빌드
npm run lint             # ESLint

# Cloudflare
npx wrangler pages dev .vercel/output/static   # Pages 로컬 미리보기
npx wrangler pages deploy .vercel/output/static --project-name kima-website
```

---

## 디렉토리 구조

```
kima-website/
├── prisma/
│   ├── schema.prisma    ← DB 스키마
│   └── seed.ts          ← 초기 데이터
├── public/
│   ├── _headers         ← Cloudflare 응답 헤더
│   ├── _redirects       ← Cloudflare 리디렉트 규칙
│   └── og-image.png     ← OG 이미지 (1200×630, 수동 추가 필요)
├── src/
│   ├── app/             ← Next.js App Router 페이지
│   │   ├── (public)/    ← 비회원 접근 가능
│   │   ├── (member)/    ← 일반회원 이상
│   │   ├── (premium)/   ← 정회원 이상
│   │   ├── (admin)/     ← 관리자 전용
│   │   └── api/         ← API Routes
│   ├── components/      ← 재사용 컴포넌트
│   ├── lib/             ← 공통 라이브러리 (auth, prisma, email, ...)
│   ├── schemas/         ← Zod 검증 스키마
│   └── workers/         ← Cloudflare Workers (cron)
├── tests/
│   ├── unit/            ← Vitest 단위 테스트
│   ├── components/      ← Testing Library 컴포넌트 테스트
│   └── e2e/             ← Playwright E2E 테스트
├── DEPLOY_CHECKLIST.md  ← 배포 단계별 체크리스트
├── wrangler.toml        ← Cloudflare 설정
└── .env.example         ← 환경변수 템플릿
```

---

## 회원 등급 체계

| 등급 | 설명 | 접근 범위 |
|------|------|----------|
| `MEMBER` | 일반회원 (무료) | 커뮤니티, 네트워크 일정 |
| `PREMIUM` | 정회원 (연 5만원) | 자료실 전문 자료 |
| `OFFICER` | 임원·위원장 | 게시글 작성, 자료 등록 |
| `ADMIN` | 관리자 | 전체 관리 페이지 |

---

## 배포

자세한 배포 절차는 [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)를 참고하세요.

---

## 문의

- 사무국: admin@kima2019.org
- 개발 문의: GitHub Issues
