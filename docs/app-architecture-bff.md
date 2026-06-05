# KIMA 앱 BFF 아키텍처 문서

> 작성일: 2026-06-05  
> 대상: kima-app (Android) ↔ kima-website (Next.js BFF)

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        KIMA Android App                         │
│                        (kima-app/)                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS  (JWT Bearer Token)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare CDN / WAF / DDoS Protection             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           Next.js BFF  (kima-website, Cloudflare Pages)         │
│                                                                 │
│  /api/mobile/*   ← 앱 전용 인증 엔드포인트                     │
│  /api/*          ← 기존 API (세션 OR Bearer 양쪽 허용)          │
│                                                                 │
│  src/lib/mobileAuth.ts  ← JWT 발급/검증 + 통합 인증 헬퍼       │
└──────────┬────────────────────────────┬─────────────────────────┘
           │                            │
           ▼                            ▼
┌──────────────────┐        ┌───────────────────────┐
│  Supabase        │        │  Supabase Storage     │
│  (PostgreSQL)    │        │  (미디어 파일)         │
│  via Prisma ORM  │        └───────────────────────┘
└──────────────────┘
```

**원칙:** 앱은 Supabase에 직접 연결하지 않습니다. 모든 데이터 접근은 Next.js API Routes를 통해서만 이루어집니다.

---

## 2. 모바일 인증 플로우

### 2-1. 로그인

```
App                     BFF (/api/mobile/login)         DB
 │                              │                        │
 │  POST { email, password }    │                        │
 │─────────────────────────────▶│                        │
 │                              │  User 조회 + bcrypt    │
 │                              │───────────────────────▶│
 │                              │◀───────────────────────│
 │                              │  JWT 서명              │
 │  { accessToken,              │                        │
 │    refreshToken, user }      │                        │
 │◀─────────────────────────────│                        │
 │                              │                        │
 │  로컬에 두 토큰 저장          │                        │
 │  (EncryptedSharedPreferences │                        │
 │   또는 Keystore)             │                        │
```

- `accessToken`: HS256 JWT, 7일 만료, 페이로드: `{ userId, email, role, expiresAt, type: "access" }`
- `refreshToken`: HS256 JWT, 30일 만료, 페이로드: `{ userId, type: "refresh" }`

### 2-2. 인증 API 호출

```
App                     BFF (/api/*)
 │                          │
 │  GET /api/mobile/profile │
 │  Authorization: Bearer   │
 │  <accessToken>           │
 │─────────────────────────▶│
 │                          │  JWT 검증 → DB 조회
 │  { id, email, role, ... }│
 │◀─────────────────────────│
```

### 2-3. 토큰 갱신

```
App                     BFF (/api/mobile/refresh)
 │                              │
 │  accessToken 만료 감지       │
 │  (HTTP 401 응답)             │
 │                              │
 │  POST { refreshToken }       │
 │─────────────────────────────▶│
 │                              │  refreshToken 검증
 │                              │  DB에서 최신 user 정보 조회
 │  { accessToken,              │
 │    refreshToken, user }      │
 │◀─────────────────────────────│
 │                              │
 │  새 토큰 저장 후 원래 요청   │
 │  재시도                      │
```

**앱 권장 구현:** Retrofit/OkHttp Authenticator를 사용해 401 응답 시 자동으로 refresh를 시도하고 새 토큰으로 원래 요청을 재시도하세요.

---

## 3. 기존 API 목록

### 3-1. 인증 불필요 (Public)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/organizations` | 단체 목록 (필터: region, language, target, type) |
| GET | `/api/organizations/[id]` | 단체 상세 |
| GET | `/api/events` | 행사 목록 (Zoom URL은 로그인 시에만 표시) |
| GET | `/api/posts` | 게시글 목록 (categoryId, type 필터) |
| GET | `/api/questions` | Q&A 목록 |
| GET | `/api/questions/[id]` | Q&A 상세 + 답변 |
| GET | `/api/stories` | 스토리 목록 (type 필터) |
| GET | `/api/stories/[id]` | 스토리 상세 |
| GET | `/api/columns` | 칼럼 목록 |
| GET | `/api/columns/[id]` | 칼럼 상세 |
| GET | `/api/legal-documents` | 법률 문서 목록 |
| GET | `/api/community/category` | 카테고리 조회 (slug) |
| GET | `/api/popups` | 현재 활성 팝업 |

### 3-2. 일반회원 이상 (MEMBER+) — Bearer Token 필요

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/mobile/profile` | 내 프로필 전체 조회 |
| PATCH | `/api/member/profile` | 프로필 수정 (name, phone, org 등) |
| POST | `/api/member/change-password` | 비밀번호 변경 |
| POST | `/api/member/request-premium` | 정회원 신청 |
| GET | `/api/resources` | 자료 목록 (role에 따라 필터됨) |
| POST | `/api/organizations` | 단체 등록 신청 |
| POST | `/api/events/[id]/attend` | 행사 참석 신청 |
| POST | `/api/questions` | Q&A 질문 등록 |
| POST | `/api/questions/[id]/answers` | 답변 등록 |
| GET | `/api/news` | 이주민 관련 뉴스 |

### 3-3. 정회원 이상 (PREMIUM+)

| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/posts` | 게시글 작성 (NOTICE/INTRODUCE는 OFFICER+ 전용) |
| POST | `/api/resources` | 자료 등록 (KIMA/MINISTRY는 OFFICER+) |
| POST | `/api/columns` | 칼럼 작성 |
| POST | `/api/stories` | 현장 스토리 등록 |

### 3-4. 임원 이상 (OFFICER+)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/admin/members` | 회원 검색 |
| GET/POST | `/api/admin/leaders` | 리더십 관리 |
| POST | `/api/admin/events` | 행사 등록 |
| POST | `/api/upload` | 미디어 업로드 |
| POST | `/api/upload/forum` | 포럼 파일 업로드 |
| GET/PATCH | `/api/member/gmfsns-orgs/[id]` | GMFSNS 단체 관리 |

### 3-5. 관리자 전용 (ADMIN)

| Method | URL | 설명 |
|--------|-----|------|
| GET/PATCH/DELETE | `/api/admin/members/[id]` | 회원 관리 |
| POST | `/api/admin/members/[id]/reset-password` | 비밀번호 초기화 |
| PATCH | `/api/admin/organizations/[id]` | 단체 승인/반려 |
| GET/POST | `/api/admin/categories` | 카테고리 관리 |
| GET/POST | `/api/admin/resources` | 자료 관리 |
| DELETE | `/api/admin/events/[id]` | 행사 삭제 |
| GET/POST/DELETE | `/api/admin/popups` | 팝업 관리 |
| POST | `/api/admin/email` | 역할 타겟 이메일 발송 |
| GET | `/api/admin/email/logs` | 이메일 발송 이력 |

### 3-6. Cron (CRON_SECRET 인증)

| Method | URL | 스케줄 | 설명 |
|--------|-----|--------|------|
| GET | `/api/cron/expiring-members` | 매일 09:00 KST | 정회원 만료 처리 + 30일 전 알림 |
| GET | `/api/cron/event-reminders` | 매일 09:00 KST | D-3 행사 리마인더 |
| GET | `/api/cron/collect-news` | 주기적 | 뉴스 자동 수집 |

---

## 4. 추가된 파일 목록

```
kima-website/
├── src/
│   ├── lib/
│   │   └── mobileAuth.ts          ← NEW: JWT 발급/검증 + getAuthUser() 통합 헬퍼
│   └── app/
│       └── api/
│           └── mobile/
│               ├── login/
│               │   └── route.ts   ← NEW: POST /api/mobile/login
│               ├── profile/
│               │   └── route.ts   ← NEW: GET /api/mobile/profile
│               └── refresh/
│                   └── route.ts   ← NEW: POST /api/mobile/refresh
```

---

## 5. 환경변수 추가 필요

`.env.local` (개발) 및 Cloudflare Pages 환경변수에 추가:

```env
# 모바일 앱 JWT 서명 키 (최소 32바이트)
# 생성: openssl rand -base64 32
MOBILE_JWT_SECRET=
```

---

## 6. 보안 고려사항

### 6-1. 토큰 저장 (Android)

```
권장: Android Keystore + EncryptedSharedPreferences
금지: SharedPreferences (평문), 외부 저장소
```

### 6-2. Certificate Pinning

앱이 kima2019.org의 TLS 인증서를 핀닝하면 MitM 공격을 방지할 수 있습니다.  
OkHttp `CertificatePinner` 사용을 권장합니다.

### 6-3. Rate Limiting

| 엔드포인트 | 제한 |
|-----------|------|
| `/api/mobile/login` | IP당 10회/15분 |
| `/api/mobile/refresh` | IP당 30회/15분 |

Cloudflare WAF의 Rate Limiting 규칙을 함께 설정하면 인스턴스 분산 환경에서도 보호됩니다.

### 6-4. 정회원 권한 검사

PREMIUM 역할은 반드시 `expiresAt > now` 조건을 함께 확인해야 합니다.

```kotlin
// Android 앱에서 만료 체크 예시
fun isActivePremium(user: User): Boolean {
    if (user.role == "ADMIN" || user.role == "OFFICER") return true
    if (user.role != "PREMIUM") return false
    val expiresAt = user.expiresAt ?: return true
    return Instant.parse(expiresAt).isAfter(Instant.now())
}
```

서버 측에서도 `src/lib/mobileAuth.ts`의 `isActivePremium()` 함수로 동일하게 검증합니다.

### 6-5. 소셜 로그인 (Google) 계정

소셜 로그인 사용자는 `password` 필드가 없습니다.  
현재 모바일 로그인은 이메일+비밀번호 방식만 지원합니다.  
Google 소셜 로그인은 추후 Google Sign-In SDK를 앱에 통합하고,  
`/api/mobile/google-login` 엔드포인트를 추가로 구현해야 합니다.

### 6-6. CORS

Next.js는 기본적으로 Same-Origin 정책을 따릅니다.  
모바일 앱은 브라우저가 아니므로 CORS 제한을 받지 않습니다.  
다만 Cloudflare WAF에서 비정상 User-Agent를 차단하지 않도록 확인하세요.

---

## 7. Android 앱 연동 예시 (Retrofit)

```kotlin
// ApiService.kt
interface KimaApiService {
    @POST("api/mobile/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("api/mobile/profile")
    suspend fun getProfile(@Header("Authorization") token: String): UserProfile

    @POST("api/mobile/refresh")
    suspend fun refresh(@Body body: RefreshRequest): LoginResponse

    @GET("api/organizations")
    suspend fun getOrganizations(
        @Query("region") region: String? = null,
        @Query("language") language: String? = null,
    ): List<Organization>
}

// TokenAuthenticator.kt — 401 시 자동 갱신
class TokenAuthenticator(private val tokenStore: TokenStore) : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
        val refreshToken = tokenStore.refreshToken ?: return null
        val newTokens = runBlocking { api.refresh(RefreshRequest(refreshToken)) }
        tokenStore.save(newTokens.accessToken, newTokens.refreshToken)
        return response.request.newBuilder()
            .header("Authorization", "Bearer ${newTokens.accessToken}")
            .build()
    }
}
```

---

## 8. 개발 체크리스트

- [ ] `MOBILE_JWT_SECRET` 환경변수 설정 (로컬 `.env.local` + Cloudflare Pages)
- [ ] Android: EncryptedSharedPreferences로 토큰 저장 구현
- [ ] Android: TokenAuthenticator로 자동 토큰 갱신 구현
- [ ] Android: 네트워크 요청에 `Authorization: Bearer <token>` 헤더 자동 삽입
- [ ] 기존 API의 권한 체크를 `getAuthUser()` 방식으로 점진적 전환 (선택)
- [ ] Cloudflare WAF에서 `/api/mobile/*` Rate Limiting 규칙 추가
