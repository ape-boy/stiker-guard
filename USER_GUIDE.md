# 스티커 가드 - 사용자 실행 가이드

**버전**: 1.0.0
**작성일**: 2025.11.02
**대상**: iOS 앱 설치 및 Firebase 설정을 진행할 사용자

---

## 📋 목차

1. [환경 요구사항](#1-환경-요구사항)
2. [Firebase 프로젝트 설정](#2-firebase-프로젝트-설정)
3. [iOS 개발 환경 설정](#3-ios-개발-환경-설정)
4. [프로젝트 설치 및 빌드](#4-프로젝트-설치-및-빌드)
5. [실제 디바이스에서 실행](#5-실제-디바이스에서-실행)
6. [Firebase 배포](#6-firebase-배포)
7. [앱 스토어 배포 준비](#7-앱-스토어-배포-준비)
8. [문제 해결 (Troubleshooting)](#8-문제-해결-troubleshooting)

---

## 1. 환경 요구사항

### 필수 소프트웨어

| 소프트웨어 | 최소 버전 | 설치 확인 명령어 |
|-----------|---------|---------------|
| **macOS** | 13.0+ (Ventura) | `sw_vers` |
| **Node.js** | 18.0+ | `node --version` |
| **npm** | 9.0+ | `npm --version` |
| **Xcode** | 15.0+ | `xcodebuild -version` |
| **CocoaPods** | 1.12+ | `pod --version` |
| **Firebase CLI** | 13.0+ | `firebase --version` |

### 소프트웨어 설치

```bash
# Homebrew 설치 (없는 경우)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 설치
brew install node

# CocoaPods 설치
sudo gem install cocoapods

# Firebase CLI 설치
npm install -g firebase-tools
```

### Xcode 설치
1. App Store에서 "Xcode" 검색 및 설치
2. Xcode Command Line Tools 설치:
```bash
xcode-select --install
```

---

## 2. Firebase 프로젝트 설정

### 2.1. Firebase 프로젝트 생성

1. **Firebase Console 접속**
   - https://console.firebase.google.com 방문
   - Google 계정으로 로그인

2. **새 프로젝트 생성**
   - "프로젝트 추가" 클릭
   - 프로젝트 이름: `StickerGuard` (또는 원하는 이름)
   - Google 애널리틱스: 선택 사항 (권장: 사용)
   - 위치: 대한민국
   - "프로젝트 만들기" 클릭

### 2.2. iOS 앱 등록

1. **iOS 앱 추가**
   - Firebase Console → 프로젝트 설정 → "iOS 앱 추가" 클릭

2. **앱 정보 입력**
   ```
   Bundle ID: com.stickerguard
   앱 닉네임: 스티커 가드
   App Store ID: (나중에 입력 가능)
   ```

3. **GoogleService-Info.plist 다운로드**
   - **중요**: 이 파일을 다운로드하세요!
   - 파일 위치: `프로젝트_루트/ios/GoogleService-Info.plist`

4. **파일 추가 방법**
   ```bash
   # 다운로드한 GoogleService-Info.plist를 ios/ 폴더로 이동
   mv ~/Downloads/GoogleService-Info.plist D:/ios_sticker/ios/
   ```

5. **Xcode에서 파일 추가** (필수!)
   - Xcode에서 프로젝트 열기: `ios/StickerGuard.xcworkspace`
   - 좌측 프로젝트 네비게이터에서 `StickerGuard` 폴더 우클릭
   - "Add Files to StickerGuard..." 선택
   - `GoogleService-Info.plist` 파일 선택
   - ✅ **"Copy items if needed"** 체크
   - ✅ **"Add to targets: StickerGuard"** 체크
   - "Add" 클릭

### 2.3. Firebase 서비스 활성화

#### 2.3.1. Firestore 데이터베이스 생성

1. **Firestore 생성**
   - Firebase Console → 빌드 → Firestore Database
   - "데이터베이스 만들기" 클릭

2. **보안 규칙 선택**
   - **프로덕션 모드**로 시작 (권장)
   - 위치: `asia-northeast3` (서울)

3. **데이터베이스 생성 완료**

#### 2.3.2. Authentication 설정

1. **Authentication 활성화**
   - Firebase Console → 빌드 → Authentication
   - "시작하기" 클릭

2. **익명 인증 활성화**
   - Sign-in method 탭 → "익명" 클릭
   - "사용 설정" 토글 ON
   - "저장" 클릭

#### 2.3.3. Cloud Functions 설정

1. **Functions 활성화**
   - Firebase Console → 빌드 → Functions
   - "시작하기" 클릭
   - Blaze 요금제로 업그레이드 (필수)
     - **주의**: Cloud Functions는 Blaze (종량제) 요금제 필요
     - 무료 할당량: 월 2백만 호출, 40만 GB-초, 20만 CPU-초
     - 프로젝트 규모로는 무료 할당량 내에서 운영 가능

### 2.4. Firebase 프로젝트 ID 설정

`.firebaserc` 파일 수정:

```bash
# D:/ios_sticker/.firebaserc 파일 열기
code .firebaserc
```

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

**프로젝트 ID 확인 방법**:
- Firebase Console → 프로젝트 설정 → 프로젝트 ID 복사

---

## 3. iOS 개발 환경 설정

### 3.1. Apple Developer 계정 설정

#### 무료 계정으로 테스트 (개발용)
```
1. Xcode 실행
2. Preferences (⌘,) → Accounts
3. 좌측 하단 "+" 클릭 → "Apple ID" 선택
4. Apple ID 로그인
```

#### 유료 계정 (배포용)
- https://developer.apple.com 에서 가입 ($99/년)

### 3.2. Xcode 프로젝트 설정

1. **Xcode에서 프로젝트 열기**
   ```bash
   cd D:/ios_sticker
   open ios/StickerGuard.xcworkspace
   ```

2. **프로젝트 설정**
   - 좌측에서 `StickerGuard` 프로젝트 선택
   - TARGETS → StickerGuard 선택

3. **General 탭 설정**
   ```
   Display Name: 스티커 가드
   Bundle Identifier: com.stickerguard
   Version: 1.0.0
   Build: 1
   Minimum Deployments: iOS 13.4
   ```

4. **Signing & Capabilities 탭 설정**
   - Team: (Apple Developer 계정 선택)
   - ✅ "Automatically manage signing" 체크
   - Signing Certificate: Apple Development
   - Provisioning Profile: Automatic

5. **Capabilities 추가** (없으면 추가)
   - 좌측 상단 "+ Capability" 클릭
   - ✅ **Background Modes**
     - Location updates
     - Remote notifications
     - Background fetch
   - ✅ **Push Notifications**

---

## 4. 프로젝트 설치 및 빌드

### 4.1. 의존성 설치

```bash
# 프로젝트 루트로 이동
cd D:/ios_sticker

# Node.js 패키지 및 CocoaPods 자동 설치
npm run setup

# 또는 개별 설치
npm install
cd ios && pod install && cd ..
```

**예상 소요 시간**: 5-10분

### 4.2. TypeScript 타입 체크

```bash
npm run type-check
```

**에러가 없어야 합니다!** 에러 발생 시 확인:
- `tsconfig.json` 설정
- Path alias 설정 (`babel.config.js`, `metro.config.js`)

### 4.3. Metro Bundler 시작

새 터미널 창에서:

```bash
npm start
```

**성공 메시지**:
```
Welcome to Metro v0.80.X
...
 BUNDLE  ./index.js
 LOG  Loading...
```

---

## 5. 실제 디바이스에서 실행

### 5.1. 시뮬레이터에서 실행 (테스트용)

```bash
# 기본 시뮬레이터 (iPhone 15)
npm run ios

# 특정 시뮬레이터
npx react-native run-ios --simulator="iPhone 15 Pro"
```

**주의**: 위치 기능과 카메라는 실제 디바이스에서만 제대로 테스트 가능!

### 5.2. 실제 디바이스에서 실행

1. **디바이스 연결**
   - Lightning 케이블로 iPhone을 Mac에 연결
   - iPhone에서 "이 컴퓨터를 신뢰하시겠습니까?" → "신뢰" 클릭

2. **Xcode에서 디바이스 선택**
   - Xcode 상단 중앙: StickerGuard > (연결된 iPhone 이름) 선택

3. **빌드 및 실행**
   ```bash
   npm run ios:device
   ```

   또는 Xcode에서 직접:
   - ▶️ (Run) 버튼 클릭 또는 `⌘R`

4. **신뢰할 수 없는 개발자 경고 해결**
   - iPhone 설정 → 일반 → VPN 및 기기 관리
   - 개발자 앱 → (Apple Developer 계정) 선택
   - "신뢰" 클릭

### 5.3. 앱 초기 실행 및 권한 허용

앱이 실행되면 다음 권한을 허용해야 합니다:

1. **알림 권한**: "허용" 클릭
2. **위치 권한**: "앱 사용 중에 허용" 또는 "항상 허용" 선택
3. **카메라 권한**: 체크인 시 "허용" 클릭

---

## 6. Firebase 배포

### 6.1. Firebase CLI 로그인

```bash
firebase login
```

**Google 계정 로그인** 브라우저 창이 열립니다.

### 6.2. Firestore Security Rules 배포

```bash
npm run firebase:deploy:rules
```

**예상 출력**:
```
✔  firestore: released rules firestore.rules to cloud.firestore
```

### 6.3. Cloud Functions 배포

```bash
# Functions 폴더로 이동
cd functions

# Functions 의존성 설치
npm install

# 상위 폴더로 복귀
cd ..

# Functions 배포
npm run firebase:deploy:functions
```

**예상 소요 시간**: 2-5분

**배포되는 함수**:
- `checkTimerExpiration`: 1분마다 타이머 만료 체크
- `onCheckInComplete`: 체크인 완료 시 통계 자동 업데이트

### 6.4. 전체 Firebase 배포

```bash
npm run firebase:deploy
```

**배포 항목**:
- Firestore Rules
- Firestore Indexes
- Cloud Functions

---

## 7. 앱 스토어 배포 준비

### 7.1. 앱 아이콘 준비

**필요한 아이콘 크기**:
```
20x20pt (@2x, @3x)
29x29pt (@2x, @3x)
40x40pt (@2x, @3x)
60x60pt (@2x, @3x)
1024x1024pt (App Store)
```

**아이콘 추가 방법**:
1. **아이콘 생성 도구 사용** (권장)
   - https://www.appicon.co
   - 1024x1024 이미지 업로드 → 모든 크기 자동 생성

2. **Xcode에 추가**
   - Xcode에서 `ios/StickerGuard/Images.xcassets` 열기
   - `AppIcon` 클릭
   - 각 크기에 맞는 이미지 드래그 앤 드롭

### 7.2. Release 빌드 테스트

```bash
npm run ios:release
```

**확인 사항**:
- 앱이 정상 실행되는지
- 모든 기능이 작동하는지
- Firebase 연결이 되는지

### 7.3. Archive 생성 (App Store 제출용)

1. **Xcode에서 Archive**
   - Product → Scheme → Edit Scheme
   - Run → Build Configuration → Release 선택
   - Product → Archive (⌘⇧B 후 ⌘B)

2. **Archive 검증**
   - Window → Organizer → Archives
   - 최신 Archive 선택 → "Validate App" 클릭
   - 검증 완료 후 → "Distribute App" 클릭

3. **TestFlight 배포**
   - App Store Connect → "Upload" 선택
   - 업로드 완료 대기 (5-10분)

### 7.4. App Store Connect 설정

1. **App Store Connect 접속**
   - https://appstoreconnect.apple.com

2. **앱 정보 입력**
   ```
   앱 이름: 스티커 가드
   부제: 보안 준수를 위한 스마트 관리
   카테고리: 비즈니스
   언어: 한국어
   ```

3. **스크린샷 준비**
   - iPhone 6.7" (Pro Max): 최소 3개
   - iPhone 6.5" (Plus): 최소 3개

4. **개인정보처리방침 URL**
   - 필수 항목
   - 별도 웹페이지 준비 필요

---

## 8. 문제 해결 (Troubleshooting)

### 8.1. Firebase 연결 오류

**증상**: `Firebase 설정 오류` Alert 표시

**해결 방법**:
1. `GoogleService-Info.plist` 파일 존재 확인
   ```bash
   ls -la ios/GoogleService-Info.plist
   ```

2. Xcode에서 파일이 Target에 포함되어 있는지 확인
   - Xcode → GoogleService-Info.plist 클릭
   - 우측 패널 → Target Membership → ✅ StickerGuard 체크

3. Firestore 데이터베이스 생성 확인
   - Firebase Console → Firestore Database 존재 여부

4. Anonymous Authentication 활성화 확인
   - Firebase Console → Authentication → Sign-in method → 익명 "사용 설정"

### 8.2. CocoaPods 설치 오류

**증상**: `pod install` 실패

**해결 방법**:
```bash
# 캐시 클리어
cd ios
pod deintegrate
pod cache clean --all
rm Podfile.lock
rm -rf Pods

# 재설치
pod install --repo-update
```

### 8.3. Xcode 빌드 오류

**증상**: `'Firebase/Firebase.h' file not found`

**해결 방법**:
```bash
cd ios
pod install
```

Xcode에서:
1. Product → Clean Build Folder (⌘⇧K)
2. 프로젝트 닫기
3. `ios/StickerGuard.xcworkspace` 다시 열기
4. 빌드 재시도

### 8.4. 위치 권한 작동 안함

**확인 사항**:
1. **Info.plist 권한 설정 확인**
   - `NSLocationWhenInUseUsageDescription` 존재
   - `NSLocationAlwaysAndWhenInUseUsageDescription` 존재

2. **Background Modes 활성화**
   - Xcode → Signing & Capabilities → Background Modes → Location updates 체크

3. **실제 디바이스 위치 서비스 활성화**
   - 설정 → 개인정보 보호 → 위치 서비스 → 켜기

### 8.5. Cloud Functions 배포 오류

**증상**: `HTTP Error: 403, Cloud Functions API has not been used`

**해결 방법**:
1. Cloud Functions API 활성화
   - https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com
   - 프로젝트 선택 → "사용" 클릭

2. Blaze 요금제 업그레이드
   - Firebase Console → 프로젝트 설정 → 사용량 및 결제
   - "요금제 수정" → Blaze (종량제) 선택

### 8.6. Metro Bundler 포트 충돌

**증상**: `Error: listen EADDRINUSE: address already in use :::8081`

**해결 방법**:
```bash
# 8081 포트 사용 프로세스 종료
lsof -ti:8081 | xargs kill

# Metro 재시작
npm start
```

---

## 📞 지원 및 문의

### 개발자 지원
- **GitHub Issues**: (프로젝트 리포지토리 URL)
- **이메일**: support@stickerguard.com

### 유용한 링크
- **Firebase 문서**: https://firebase.google.com/docs
- **React Native 문서**: https://reactnative.dev
- **React Navigation 문서**: https://reactnavigation.org

---

## ✅ 체크리스트

설치 및 설정을 완료했는지 확인하세요:

### Firebase 설정
- [ ] Firebase 프로젝트 생성
- [ ] iOS 앱 등록 (Bundle ID: com.stickerguard)
- [ ] GoogleService-Info.plist 다운로드 및 Xcode에 추가
- [ ] Firestore 데이터베이스 생성
- [ ] Anonymous Authentication 활성화
- [ ] `.firebaserc` 파일에 프로젝트 ID 설정
- [ ] Firestore Rules 배포
- [ ] Cloud Functions 배포

### iOS 설정
- [ ] Xcode 15+ 설치
- [ ] Apple Developer 계정 설정
- [ ] Xcode 프로젝트 Signing 설정
- [ ] Background Modes 및 Push Notifications Capability 추가
- [ ] 앱 아이콘 추가

### 빌드 및 테스트
- [ ] `npm run setup` 실행 완료
- [ ] `npm run type-check` 에러 없음
- [ ] 시뮬레이터에서 앱 실행 성공
- [ ] 실제 디바이스에서 앱 실행 성공
- [ ] 위치 권한 테스트 (회사 근처에서)
- [ ] 카메라 권한 테스트
- [ ] 알림 테스트 (0, 5, 15, 30분)
- [ ] 45분 타이머 테스트
- [ ] 계정 잠금 테스트

### 배포 준비
- [ ] Release 빌드 테스트
- [ ] Archive 생성 및 검증
- [ ] TestFlight 업로드
- [ ] App Store Connect 정보 입력
- [ ] 스크린샷 준비
- [ ] 개인정보처리방침 URL 준비

---

**마지막 업데이트**: 2025.11.02
**문서 버전**: 1.0
**작성자**: AI Development Agent
