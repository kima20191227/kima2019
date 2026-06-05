# KIMA 앱 (kima-app)

한국이주민선교연합회 공식 모바일 앱 — Expo (React Native) 기반

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Expo SDK 52 (React Native 0.76) |
| 라우팅 | Expo Router v4 (파일 기반) |
| 스타일 | NativeWind v4 (Tailwind CSS) |
| 상태 관리 | Zustand + TanStack Query |
| 인증 | JWT (HS256) via kima-website API |
| 빌드 | EAS Build |
| 배포 | Google Play Store |

---

## 로컬 개발 환경 설정

### 1. 패키지 설치

```bash
cd kima-app
npm install

# expo-device 설치 (푸시 알림 필요)
npx expo install expo-device expo-build-properties
```

### 2. 환경변수 설정

`.env` 파일을 확인하고 필요한 경우 수정하세요:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

프로덕션 빌드는 `eas.json`의 `env` 섹션에서 관리합니다.

### 3. 자리표시자 에셋 생성

```bash
node generate-assets.js
```

> ⚠️ 실제 빌드 전에 `assets/images/` 내 파일을 디자인 파일로 교체하세요.

### 4. kima-website API 서버 실행

```bash
cd ../kima-website
npm run dev   # http://localhost:3000 에서 실행
```

### 5. 앱 개발 서버 시작

```bash
# Expo Go 앱으로 실행 (물리 기기)
npx expo start

# Android 에뮬레이터
npx expo start --android

# iOS 시뮬레이터 (macOS 전용)
npx expo start --ios
```

---

## EAS Build (클라우드 빌드)

### 사전 요구사항

```bash
# EAS CLI 전역 설치
npm install -g eas-cli

# expo.dev 계정 로그인
eas login

# 프로젝트와 EAS 연결 (최초 1회)
eas init
```

`app.json`의 `extra.eas.projectId` 값을 EAS에서 발급된 ID로 업데이트하세요.

---

### 개발용 빌드 (Development Client)

```bash
eas build --platform android --profile development
```

- APK 파일 생성 (`developmentClient: true`)
- 내부 배포용 (`distribution: internal`)
- API: `http://localhost:3000` (로컬 서버)

---

### 내부 테스트 APK (Preview)

```bash
eas build --platform android --profile preview
```

- APK 파일 생성 — Google Play 없이 직접 설치 가능
- API: `https://kima2019.org` (프로덕션 서버)
- 내부 테스터에게 다운로드 링크로 배포

---

### 프로덕션 AAB (Production)

```bash
eas build --platform android --profile production
```

- AAB(Android App Bundle) 생성 — Google Play 제출용
- API: `https://kima2019.org`

---

### Google Play 자동 제출

```bash
# 빌드 후 바로 내부 테스트 트랙에 제출
eas submit --platform android --profile production

# 또는 빌드 + 제출 한 번에
eas build --platform android --profile production --auto-submit
```

> `eas.json`의 `submit.production.android.serviceAccountKeyPath`에
> Google Play 서비스 계정 JSON 경로를 설정해야 합니다.

---

## 버전 관리

앱 버전을 올릴 때는 두 곳을 함께 업데이트하세요:

| 파일 | 필드 | 설명 |
|------|------|------|
| `app.json` | `version` | 사용자에게 표시되는 버전 (1.0.0) |
| `app.json` | `android.versionCode` | Google Play 빌드 번호 (단조 증가) |

```bash
# 현재 버전 확인
cat app.json | grep -E '"version"|"versionCode"'
```

---

## 프로젝트 구조

```
kima-app/
├── app/                    # Expo Router 페이지 (파일 = 라우트)
│   ├── (tabs)/             # 하단 탭 네비게이션
│   │   ├── home.tsx        # 홈
│   │   ├── map.tsx         # 지도
│   │   ├── community.tsx   # 커뮤니티
│   │   ├── resources.tsx   # 자료실
│   │   └── mypage.tsx      # 마이페이지
│   ├── (public)/           # 비회원 접근 가능
│   ├── (member)/           # MEMBER 이상 필요
│   ├── (premium)/          # PREMIUM 이상 필요
│   └── auth/               # 로그인·회원가입 모달
├── src/
│   ├── api/                # Axios 클라이언트
│   ├── auth/               # 인증 Context + RequireRole
│   ├── components/         # 재사용 컴포넌트
│   ├── store/              # Zustand 스토어
│   ├── types/              # TypeScript 타입
│   └── utils/              # 유틸리티 함수
├── assets/images/          # 앱 아이콘·스플래시 (빌드 필요)
├── app.json                # Expo 앱 설정
├── eas.json                # EAS Build 프로파일
└── generate-assets.js      # 자리표시자 에셋 생성 스크립트
```

---

## 주요 환경변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `EXPO_PUBLIC_API_BASE_URL` | kima-website API 주소 | `https://kima2019.org` |

> `EXPO_PUBLIC_` 접두사가 있는 변수만 앱 번들에 포함됩니다.

---

## 자주 쓰는 명령어

```bash
# TypeScript 타입 체크
npx tsc --noEmit

# Metro 캐시 초기화 (이상 동작 시)
npx expo start --clear

# EAS 빌드 상태 확인
eas build:list

# 앱 버전 확인
eas build:version:get --platform android
```

---

## 관련 문서

- [Google Play 출시 체크리스트](../docs/DEPLOY_CHECKLIST_ANDROID.md)
- [kima-website API 서버](../kima-website/README.md)
- [Expo EAS Build 공식 문서](https://docs.expo.dev/build/introduction/)
