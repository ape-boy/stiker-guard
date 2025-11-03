# Sticker Guard - Android

**기업 보안 정책 강화를 위한 Android 애플리케이션**

카메라 스티커 부착 여부를 위치 기반으로 자동 검증하고, 엄격한 시간 제약을 통해 보안 정책 준수를 강제하는 Android 전용 앱입니다.

## ✨ 주요 기능

- 📍 **위치 기반 자동 감지**: 회사 반경 300m 진입 시 자동 알림
- ⏱️ **45분 타이머**: 진입 후 45분 내 체크인 필수
- 📸 **카메라 검증**: 후면 카메라로 스티커 부착 확인
- 🔔 **4단계 알림**: 0분, 5분, 15분, 30분 경과 시점 알림
- 🔒 **계정 잠금**: 타이머 만료 시 자동 잠금 및 데이터 삭제
- 📊 **통계 및 배지**: 연속 출석, 완벽한 주, 월별 달성률 추적

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/yourusername/sticker-guard.git
cd sticker-guard
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 설정
1. Firebase Console에서 `google-services.json` 다운로드
2. `android/app/google-services.json`에 배치

### 4. GitHub Secrets 설정 (CI/CD용)
Repository → Settings → Secrets and variables → Actions

필요한 5개 Secrets:
- `GOOGLE_SERVICES_JSON`
- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

자세한 설정 방법: [DEPLOYMENT.md](./DEPLOYMENT.md)

### 5. 배포
```bash
# 자동 배포 스크립트
.\scripts\deploy-to-github.ps1

# 또는 수동
git add .
git commit -m "feat: Initial release"
git push origin main
```

→ GitHub Actions가 자동으로 APK 빌드!

## 📦 기술 스택

- **Framework**: React Native 0.76.1
- **Language**: TypeScript 5.6.3
- **Backend**: Firebase (Firestore, Auth, Functions, FCM)
- **State**: Zustand 5.0
- **Navigation**: React Navigation 6.x
- **Location**: react-native-geolocation-service
- **Camera**: react-native-vision-camera 4.6.3
- **Notifications**: @notifee/react-native 9.0.3

## 🎯 시스템 요구사항

- **Android**: 7.0 (API 24) 이상
- **Node.js**: 18.x 이상
- **Java**: JDK 17 (로컬 빌드 시)
- **Android SDK**: Build Tools 34.0.0

## 📱 앱 실행

### 로컬 개발
```bash
# Metro 서버 시작
npm start

# Android 실행
npm run android
```

### 빌드
```bash
# Debug APK
cd android
./gradlew assembleDebug

# Release APK (keystore 필요)
./gradlew assembleRelease

# AAB (Play Store용)
./gradlew bundleRelease
```

## 🔐 보안

- ✅ HTTPS 전용 통신 (Cleartext Traffic 차단)
- ✅ Network Security Config 적용
- ✅ Firebase 키 보호 (gitignore)
- ✅ ProGuard 난독화 (Release 빌드)
- ✅ 앱 서명 인증서 관리

자세한 보안 정책: [SECURITY.md](./SECURITY.md)

## 🤖 자동화 (GitHub Actions)

### Debug Build
- **트리거**: Push to `main` or `develop`
- **결과**: Debug APK (Artifacts에서 다운로드)
- **시간**: ~3-4분

### Release Build
- **트리거**: Version tag (예: `v1.0.0`)
- **결과**: Release APK + AAB (자동 GitHub Release 생성)
- **시간**: ~5-7분

### E2E Tests
- **트리거**: Push to `main` or PR
- **테스트**: Android API 29, 31, 34
- **시간**: ~15-20분

## 📂 프로젝트 구조

```
sticker-guard/
├── android/              # Android 네이티브 코드
│   ├── app/
│   │   ├── src/main/java/com/stickergaurdman/
│   │   └── google-services.json (gitignore)
│   └── build.gradle
├── src/                  # React Native 소스
│   ├── screens/         # 화면 컴포넌트
│   ├── services/        # 비즈니스 로직
│   └── stores/          # 상태 관리
├── .github/workflows/   # CI/CD 파이프라인
├── scripts/             # 자동화 스크립트
└── package.json
```

## 📖 문서

- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - 전체 설정 가이드
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 배포 가이드
- [SECURITY.md](./SECURITY.md) - 보안 정책
- [CHANGELOG.md](./CHANGELOG.md) - 변경 이력

## 🎓 주요 개념

### 위치 기반 체크인
회사 위치 (37.2253811, 127.0706423) 기준 300m 반경 진입 시:
1. 자동 감지
2. 45분 타이머 시작
3. 4단계 알림 (0, 5, 15, 30분)
4. 시간 내 카메라로 스티커 확인
5. 타이머 만료 시 계정 잠금

### 계정 잠금
타이머 만료 시 **비가역적** 데이터 삭제:
- 모든 체크인 기록
- 통계 및 배지
- 로컬 데이터
- 앱 재설치 필요

## 🔧 트러블슈팅

### 빌드 실패
```bash
# Gradle 캐시 정리
cd android && ./gradlew clean

# 전체 재빌드
npm run clean:all
npm install
npm run android
```

### Firebase 연결 오류
- `google-services.json` 파일 위치 확인 (`android/app/`)
- Firebase Console에서 SHA-1 등록 확인
- Package name: `com.stickergaurdman`

### 권한 문제
- AndroidManifest.xml에서 모든 권한 확인
- Android 13+: POST_NOTIFICATIONS 권한 요청 필요
- Android 10+: 백그라운드 위치 권한 별도 요청

## 🚀 배포 프로세스

### Google Play Store
1. AAB 생성: `npm run android:bundle`
2. Play Console에서 새 릴리즈 생성
3. `android/app/build/outputs/bundle/release/app-release.aab` 업로드
4. 검토 제출

### 직접 배포 (APK)
1. APK 생성: `npm run android:release`
2. `android/app/build/outputs/apk/release/app-release.apk` 배포

## 📊 성능 지표

- **빌드 시간**: Debug 3-4분, Release 5-7분
- **APK 크기**: Debug ~40MB, Release ~25MB
- **배터리 사용**: ~3-5% per day (위치 추적)
- **위치 정확도**: >95% within 300m

## 🤝 기여

버그 리포트 및 기능 제안은 [Issues](https://github.com/yourusername/sticker-guard/issues)에 등록해주세요.

## 📄 라이선스

MIT License

## 📧 지원

- Email: support@example.com
- GitHub Issues: [링크](https://github.com/yourusername/sticker-guard/issues)

---

**Made with ❤️ for corporate security**
