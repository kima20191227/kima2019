# KIMA 앱 출시 전 QA 보고서

**작성일:** 2026-06-05  
**대상 버전:** 1.0.0 (versionCode: 1)  
**검토 범위:** kima-app/ + kima-website/

---

## 출시 기준 달성 여부

| 기준 | 목표 | 결과 |
|------|------|------|
| 긴급(🔴) 이슈 | 0개 | **0개 ✅** |
| 보통(🟡) 이슈 해결률 | 80% 이상 | **100% ✅** |
| 낮음(🟢) 이슈 | 참고만 | 4개 확인 |

> **✅ 출시 가능 (Go)**  
> 긴급 이슈 없음. 모든 보통 이슈 이번 QA 세션에서 해결 완료.

---

## 1. 네트워크 오류 처리

### 점검 항목

| 항목 | 이전 | 이후 | 상태 |
|------|------|------|------|
| API 타임아웃 | 15초 | 10초 | 🟢 수정 완료 |
| 네트워크 오류 재시도 | 없음 | 최대 3회 (지수 백오프 1s→2s→4s) | 🟡 **수정 완료** |
| 5xx 서버 오류 재시도 | 없음 | 최대 3회 | 🟡 **수정 완료** |
| 오프라인 배너 | 없음 | OfflineBanner 컴포넌트 추가 | 🟡 **수정 완료** |

### 구현 내용

- **`src/api/client.ts`**: 타임아웃 10s, 재시도 인터셉터 추가
  - 네트워크 오류(`!error.response`) 또는 5xx → 최대 3회 재시도
  - 로그인·갱신 엔드포인트(`/api/mobile/login`, `/api/mobile/refresh`)는 재시도 제외
  - `_retry` 플래그가 있는 401 재시도 중에는 재시도 제외 (무한루프 방지)
- **`src/components/ui/OfflineBanner.tsx`**: NetInfo 연결 상태 감지 → 슬라이드인 배너
- **`app/_layout.tsx`**: OfflineBanner를 루트 레이아웃에 마운트

---

## 2. 로딩 UX

### 점검 항목

| 항목 | 이전 | 이후 | 상태 |
|------|------|------|------|
| 커뮤니티 탭 로딩 | ActivityIndicator | SkeletonList (6개 RowSkeleton) | 🟡 **수정 완료** |
| 지도 탭 로딩 | ActivityIndicator | ActivityIndicator (지도 특성상 유지) | 🟢 양호 |
| 자료실 탭 로딩 | ActivityIndicator | ActivityIndicator (부트스트랩 중 표시) | 🟢 양호 |
| expo-image placeholder | 색상 `#E5E7EB` 설정됨 | - | 🟢 이미 적용 |
| 폼 제출 disabled 처리 | React Hook Form의 `isSubmitting` 활용 | - | 🟢 이미 적용 |
| FlatList `removeClippedSubviews` | 없음 | community.tsx에 추가 | 🟢 수정 완료 |

---

## 3. 접근 제어 최종 검증

### 시나리오별 동작

| 시나리오 | 경로 | 예상 동작 | 구현 상태 |
|----------|------|-----------|-----------|
| 미인증 → 커뮤니티 | `/(tabs)/community` | `RequireRole minRole="MEMBER"` → 로그인 유도 화면 | ✅ |
| 미인증 → 자료실 | `/(tabs)/resources` | `LoginGate` → 로그인 버튼 | ✅ |
| MEMBER → 자료실 | `/(tabs)/resources` | `PremiumGate` → 정회원 업그레이드 안내 | ✅ |
| PREMIUM (만료) → 자료실 | `/(tabs)/resources` | `ExpiredGate` → 갱신 안내 + 계좌 정보 | ✅ |
| PREMIUM (활성) → 자료실 | `/(tabs)/resources` | `ResourcesIndexScreen` 정상 접근 | ✅ |
| OFFICER/ADMIN → 자료실 | `/(tabs)/resources` | `isPremiumActive()` → true (만료 무관) | ✅ |
| 미인증 → 게시글 작성 | `/(member)/community/.../write` | `RequireRole minRole="OFFICER"` | ✅ |
| MEMBER → 게시글 작성 | 위 동일 | 권한 부족 화면 | ✅ |

**서버 측 보안**: 모든 API Route에서 JWT 검증 + 역할 체크 수행. 클라이언트 체크는 UX용 전용.

---

## 4. 보안 점검

### 항목별 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| 토큰 저장소 | ✅ SecureStore 전용 | AsyncStorage 미사용 확인 |
| `console.log(token)` | ✅ 없음 (수정 완료) | 부분 토큰 슬라이스도 제거 |
| `EXPO_PUBLIC_` 민감 정보 | ✅ `EXPO_PUBLIC_API_BASE_URL`만 공개 | API 키/시크릿 없음 |
| JWT 만료 처리 | ✅ 인터셉터에서 자동 갱신 | 갱신 실패 시 로그아웃 |
| 로그아웃 시 토큰 삭제 | ✅ `unregisterPushToken()` → `logout()` 순서 보장 | |
| 구글 드라이브 링크 노출 | ✅ 서버 권한 확인 후 반환 | 클라이언트는 UX용 |

**수정 내용**:
- `pushNotification.ts`: `console.log('[Push] 토큰 등록 완료:', token.slice(0, 30))` 제거
- `pushNotification.ts`: `console.log('[Push] 토큰 해제 완료')` 제거

---

## 5. 구글 플레이 정책 준수

| 항목 | 상태 | 비고 |
|------|------|------|
| 후원 결제 흐름 | ✅ 외부 링크(계좌 정보 표시) | 인앱 결제 미사용 → Play 정책 준수 |
| 개인정보처리방침 URL | ✅ mypage에 추가 (수정 완료) | `WebBrowser.openBrowserAsync('https://kima2019.org/privacy')` |
| 광고 | ✅ 없음 | |
| 최소 권한 원칙 | ✅ `INTERNET` + `RECEIVE_BOOT_COMPLETED`만 요청 | 카메라·마이크·위치 미사용 |
| 데이터 안전성 양식 | ⚠️ Play Console에서 별도 작성 필요 | DEPLOY_CHECKLIST_ANDROID.md 참고 |

---

## 6. 성능 점검

### 지도 (50+ 마커)

| 항목 | 이전 | 이후 | 상태 |
|------|------|------|------|
| 마커 배열 재생성 | 매 렌더마다 | `useMemo([orgs])` | 🟡 **수정 완료** |
| Marker 컴포넌트 분리 | 인라인 익명 컴포넌트 | `OrgMarker` 별도 컴포넌트 | 🟡 **수정 완료** |
| 필터 변경 시 리페치 | TanStack Query `queryKey` 변경 시 자동 | - | ✅ 이미 적용 |

> **50+ 마커 성능**: `useMemo` + 컴포넌트 분리로 불필요한 리렌더 방지.
> react-native-maps 자체는 네이티브 렌더링이므로 JS 스레드 부담 낮음.

### 커뮤니티 목록 (100개 스크롤)

| 항목 | 상태 | 비고 |
|------|------|------|
| `keyExtractor` | ✅ `item.id` 사용 | |
| `removeClippedSubviews` | ✅ 추가 완료 | |
| 서버 페이지네이션 | 🟢 낮음 | 현재 카테고리 수(~20개)에서는 불필요. 게시글 FlatList에는 적용 권장 |

### 콜드 스타트 (<3초 목표)

| 항목 | 상태 |
|------|------|
| 앱 부트스트랩 | SecureStore 토큰 확인 → API 1회 호출 |
| 스플래시 화면 | `expo-splash-screen` 내장 처리 |
| 번들 크기 | Expo managed — Metro 기본 최적화 적용 |

> 실기기 측정은 `eas build --profile development`로 빌드 후 확인 권장.

---

## 7. 잔여 낮음(🟢) 이슈 (출시 후 개선 권장)

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 1 | 게시글 FlatList 페이지네이션 | 게시글 100개 이상 시 FlatList `onEndReached` + 페이지네이션 추가 권장 | 낮음 |
| 2 | `getItemLayout` 최적화 | 고정 높이 목록에서 `getItemLayout` 제공 시 스크롤 점프 방지 | 낮음 |
| 3 | TanStack Query `retry: 1` (전역) | `_layout.tsx`의 QueryClient 기본 옵션에서 `retry: 1`이 이미 설정됨. 인터셉터 재시도와 중복되므로 `retry: 0`으로 낮추는 것 검토 | 낮음 |
| 4 | iOS 지원 | 현재 Android 전용 빌드. `expo-notifications` iOS 권한 메시지 `NSUserNotificationsUsageDescription` 추가 필요 | 낮음 |

---

## 8. 수정 완료 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `kima-app/src/api/client.ts` | 타임아웃 15s→10s, 재시도 인터셉터 추가 |
| `kima-app/src/components/ui/OfflineBanner.tsx` | 신규 생성 |
| `kima-app/app/_layout.tsx` | OfflineBanner 마운트 |
| `kima-app/app/(tabs)/mypage.tsx` | 개인정보처리방침 메뉴 항목 추가 |
| `kima-app/app/(tabs)/map.tsx` | useMemo 마커 최적화, OrgMarker 컴포넌트 분리 |
| `kima-app/app/(tabs)/community.tsx` | SkeletonList 로딩 UX, removeClippedSubviews 추가 |
| `kima-app/src/utils/pushNotification.ts` | 토큰 관련 console.log 제거 |

---

## 9. 출시 전 남은 수동 작업

- [ ] Play Console 데이터 안전성 양식 작성 (`docs/DEPLOY_CHECKLIST_ANDROID.md` STEP 7 참고)
- [ ] `assets/images/` 자리표시자 파일을 실제 디자인으로 교체
- [ ] `https://kima2019.org/privacy` 페이지 배포 확인
- [ ] 실기기에서 콜드 스타트 3초 이내 측정
- [ ] 내부 테스트 트랙(5명 이상)에서 2주 이상 사용 검증
