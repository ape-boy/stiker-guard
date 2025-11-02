# 📱 스티커 가드 (Sticker Guard)

> 회사 보안 정책 준수를 위한 카메라 스티커 관리 iOS 앱

## 🎯 프로젝트 개요

스티커 가드는 회사 출근 시 카메라 스티커 부착 여부를 자동으로 확인하고, 강제성 시스템을 통해 100% 준수율을 보장하는 앱입니다.

### 핵심 기능

- ✅ **자동 위치 감지**: 회사 300m 반경 진입 시 자동 알림
- 📸 **카메라 검증**: 사용자가 직접 후면 카메라로 스티커 확인
- ⏱️ **45분 타이머**: 진입 후 45분 내 체크 필수
- 🔒 **계정 잠금**: 미체크 시 모든 데이터 삭제 및 재설치 필요
- 📊 **통계 및 연속 기록**: 동기 부여를 위한 Streak 시스템

## 🏗️ 기술 스택

- **Frontend**: React Native 0.76.1 + TypeScript
- **State Management**: Zustand 5.0
- **Navigation**: React Navigation 6
- **Backend**: Firebase (Auth, Firestore, Functions, FCM)
- **Location**: react-native-geolocation-service
- **Camera**: react-native-vision-camera
- **Notifications**: @notifee/react-native

## 📁 프로젝트 구조

```
src/
├── components/          # UI 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── checkin/        # 체크인 관련
│   └── stats/          # 통계 관련
├── screens/            # 화면
│   ├── onboarding/     # 온보딩 플로우
│   ├── main/           # 메인 앱 화면
│   └── lock/           # 계정 잠금
├── services/           # 비즈니스 로직
│   ├── locationService.ts
│   ├── checkInService.ts
│   ├── timerService.ts
│   ├── notificationService.ts
│   ├── lockService.ts
│   └── statsService.ts
├── stores/             # Zustand 상태 관리
│   ├── authStore.ts
│   ├── locationStore.ts
│   ├── checkInStore.ts
│   ├── timerStore.ts
│   └── statsStore.ts
├── hooks/              # Custom React Hooks
├── utils/              # 유틸리티 함수
├── api/                # Firebase API
├── models/             # TypeScript 타입
└── navigation/         # 네비게이션
```

## 🚀 시작하기

### 1. 환경 요구사항

- Node.js >= 18
- React Native CLI
- Xcode 15+ (iOS 개발)
- CocoaPods

### 2. 설치

```bash
# 의존성 설치
npm install

# iOS 의존성 설치
cd ios && pod install && cd ..
```

### 3. Firebase 설정

1. Firebase 프로젝트 생성
2. iOS 앱 등록
3. `GoogleService-Info.plist` 다운로드 → `ios/StickerGuard/` 폴더에 복사
4. Firestore, Authentication, Functions, FCM 활성화

### 4. 실행

```bash
# iOS 실행
npm run ios

# 개발 서버 시작
npm start
```

## 🔧 주요 설정

### 회사 위치 설정

`src/utils/constants.ts` 파일에서 회사 위치 수정:

```typescript
export const COMPANY_LOCATION = {
  latitude: 37.2253811,
  longitude: 127.0706423,
  radius: 300, // 미터
};
```

### Info.plist 권한 설정

`ios/StickerGuard/Info.plist`에 다음 권한 추가:

```xml
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>회사 도착 시 자동으로 스티커 체크 알림을 보내기 위해 위치 권한이 필요합니다.</string>

<key>NSCameraUsageDescription</key>
<string>카메라 스티커 부착 여부를 확인하기 위해 카메라 권한이 필요합니다.</string>

<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

## 📋 개발 로드맵

- [x] Phase 1: 아키텍처 설계 및 기술 분석
- [x] Phase 2: 프로젝트 구조 및 초기 설정
- [ ] Phase 3: 핵심 기능 개발 - 위치 추적 시스템
- [ ] Phase 4: 핵심 기능 개발 - 카메라 검증 시스템
- [ ] Phase 5: 핵심 기능 개발 - 45분 타이머 & 알림
- [ ] Phase 6: 핵심 기능 개발 - 계정 잠금 시스템
- [ ] Phase 7: UI/UX 구현 (모든 화면)
- [ ] Phase 8: Firebase 백엔드 구축
- [ ] Phase 9: 통합 테스트 및 검증
- [ ] Phase 10: 최적화 및 배포 준비

## 📚 문서

- [아키텍처 설계서](./ARCHITECTURE.md)
- [기술 명세서](./TECHNICAL_SPECS.md)
- [기획서](./스티커카드.md)

## 🧪 테스트

```bash
# Unit Tests
npm test

# E2E Tests (Detox)
npm run e2e:ios
```

## 📦 빌드

```bash
# iOS Release 빌드
cd ios
xcodebuild -workspace StickerGuard.xcworkspace \
           -scheme StickerGuard \
           -configuration Release \
           -archivePath build/StickerGuard.xcarchive \
           archive
```

## 🤝 기여

이 프로젝트는 사내 보안 준수 목적으로 개발되었습니다.

## 📄 라이선스

Proprietary

## 📧 연락처

- 제품 문의: product@stickerguard.com
- 기술 지원: support@stickerguard.com
