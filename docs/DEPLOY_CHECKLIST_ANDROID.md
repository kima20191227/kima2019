# Google Play 출시 체크리스트
## KIMA 앱 — Android 배포 가이드

> 처음 출시 시 이 문서를 순서대로 따르세요.
> 패키지명: `org.kima2019.app`
> 앱 이름: `KIMA - 한국이주민선교연합회`

---

## STEP 1 — 사전 계정 준비

- [ ] **Google Play 개발자 계정 등록** ($25 일회성)
      https://play.google.com/console → 계정 생성 → 결제
      ※ 비영리단체도 동일하게 개인/법인 계정으로 등록

- [ ] **EAS(Expo Application Services) 계정 생성**
      https://expo.dev → 회원가입 → 새 프로젝트 생성
      ```bash
      npm install -g eas-cli
      eas login
      eas init          # kima-app/ 에서 실행
      ```
      발급된 `projectId`를 `app.json → extra.eas.projectId`에 입력

---

## STEP 2 — 앱 서명 키 생성

EAS Build가 서명 키를 자동 생성하고 Expo 서버에 안전하게 보관합니다.

```bash
# 최초 프로덕션 빌드 시 자동으로 키 생성 여부를 묻습니다
eas build --platform android --profile production
```

> ⚠️ 서명 키는 절대 분실하면 안 됩니다.
> EAS 대시보드 → Credentials에서 백업 파일을 다운로드하세요.

---

## STEP 3 — 앱 에셋 준비

- [ ] **아이콘 (1024×1024 PNG)**
      `assets/images/icon.png` 교체
      배경 없는 단일 로고 권장

- [ ] **Adaptive 아이콘 (1024×1024 PNG, 투명 배경)**
      `assets/images/adaptive-icon.png` 교체
      Android 8.0+ 라운드 아이콘에 사용

- [ ] **스플래시 이미지 (1284×2778 PNG)**
      `assets/images/splash.png` 교체
      네이비(#1B3A6B) 배경 + 중앙 KIMA 로고

- [ ] **알림 아이콘 (96×96 PNG, 흰색 단색)**
      `assets/images/notification-icon.png` 교체
      Android 알림 상태바 아이콘

> 자리표시자 파일 생성: `node generate-assets.js`

---

## STEP 4 — Firebase 설정 (FCM — 선택사항)

Expo의 기본 FCM을 사용하는 경우 별도 설정 불필요.
Firebase Console에서 직접 FCM을 관리하려면:

- [ ] https://console.firebase.google.com → 새 프로젝트 → Android 앱 추가
      패키지명: `org.kima2019.app`
- [ ] `google-services.json` 다운로드 → `kima-app/` 루트에 배치
      (`app.json`의 `android.googleServicesFile` 이미 설정됨)

---

## STEP 5 — 프로덕션 빌드

```bash
# kima-app/ 디렉토리에서 실행
eas build --platform android --profile production
```

빌드 완료 후 EAS 대시보드 또는 CLI에서 AAB 파일 다운로드:
```bash
eas build:list --platform android --status finished
```

---

## STEP 6 — Google Play Console 설정

### 앱 기본 정보

- [ ] Play Console → 앱 만들기
      - 앱 이름: `KIMA - 한국이주민선교연합회`
      - 기본 언어: `한국어 (ko)`
      - 앱/게임 유형: `앱`
      - 유료/무료: `무료`

- [ ] 앱 정보 작성
      - 간략한 설명 (80자): `이주민 사역자 연결 플랫폼 — 연결하고 기록하고 보이게 하고 후원으로 이어주는`
      - 자세한 설명 (4000자): KIMA 소개 전문 입력
      - 카테고리: `소셜`
      - 태그: `이주민`, `선교`, `다문화`, `커뮤니티`

### 그래픽 자료

- [ ] **앱 아이콘** (512×512 PNG, 32비트, 투명 배경 없음)
- [ ] **기능 그래픽** (1024×500 PNG 또는 JPEG) — Play Store 상단 배너
- [ ] **스크린샷** (최소 2장, 권장 8장)
      - 폰 스크린샷: 1080×1920 이상 (세로)
      - 권장 화면: 홈 / 지도 / 커뮤니티 / 자료실 / 마이페이지
- [ ] **소개 동영상** (선택, YouTube URL)

---

## STEP 7 — 정책 및 규정 준수

### 개인정보 처리 방침

- [ ] **개인정보처리방침 URL** 입력: `https://kima2019.org/privacy`
      ※ kima-website에 `/privacy` 페이지가 구현되어 있어야 합니다

### 데이터 안전성

- [ ] Play Console → 데이터 안전성 양식 작성

| 항목 | 값 |
|------|-----|
| 수집하는 데이터 유형 | 이름, 이메일, 기기 ID(푸시 토큰), 앱 활동 |
| 데이터 공유 여부 | 없음 (서드파티 공유 없음) |
| 데이터 암호화 전송 | 예 (HTTPS) |
| 데이터 삭제 요청 가능 | 예 (회원 탈퇴 기능) |

### 콘텐츠 등급

- [ ] Play Console → 콘텐츠 등급 → 등급 받기 설문 완료
      - 앱 카테고리: `종교`
      - 예상 등급: `전체이용가` (폭력·선정성 없음)

### 광고

- [ ] `광고 없음` 체크 확인

---

## STEP 8 — 내부 테스트 트랙

정식 출시 전 내부 테스터로 검증합니다.

- [ ] Play Console → 테스트 → 내부 테스트 → 새 출시 만들기
      - AAB 파일 업로드 (STEP 5에서 빌드한 파일)
      - 출시 노트 작성 (한국어): `KIMA 앱 초기 버전 내부 테스트`

- [ ] 내부 테스터 이메일 추가 (최소 5명 권장)
      - 개발팀, 사무국장, 임원단 대표자 등

- [ ] 테스터가 앱 설치 후 2주 이상 사용 확인
      - 로그인 / 지도 / 커뮤니티 / 알림 정상 동작 확인

---

## STEP 9 — 비공개 테스트 → 공개 출시

- [ ] 내부 테스트 완료 후 비공개(폐쇄형) 테스트 트랙으로 이동
      최소 20명 테스터로 14일 이상 테스트

- [ ] 정식 출시 심사 신청
      - Play Console → 프로덕션 → 국가/지역: `한국`
      - Google 심사 완료까지 1~7일 소요

---

## STEP 10 — 출시 후 체크리스트

- [ ] Google Play 등록 URL 확인 및 홈페이지(kima2019.org) 연결
- [ ] Expo Push 알림 정상 수신 확인 (공지 등록 → 앱 알림)
- [ ] Firebase/EAS 크래시 리포트 모니터링 설정
- [ ] 첫 업데이트 배포 절차 숙지:
      ```bash
      # 1. app.json → versionCode 증가 (예: 1 → 2)
      # 2. 빌드
      eas build --platform android --profile production
      # 3. Play Console에서 새 출시 만들기 → AAB 업로드
      ```

---

## 참고 비용

| 항목 | 비용 |
|------|------|
| Google Play 개발자 등록비 | $25 (일회성) |
| EAS Build (Free tier) | 월 30빌드 무료 |
| EAS Build (Production tier) | $99/월 (무제한 빌드) |
| Google Play 수수료 | 무료 앱은 0% |

> 무료 앱이므로 Google Play 수수료 없음.
> EAS Free tier로 월 30회 빌드 가능 — 초기에는 충분합니다.

---

## 연락처

- 개발 문의: admin@kima2019.org
- EAS 대시보드: https://expo.dev
- Google Play Console: https://play.google.com/console
