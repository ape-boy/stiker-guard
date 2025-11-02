# GitHub Actions - iOS 빌드 자동화

이 디렉토리는 iOS 앱 빌드 및 배포를 자동화하는 GitHub Actions 워크플로우를 포함합니다.

## 📋 워크플로우 목록

### 1. `ios-build-simulator.yml` ✅ **지금 바로 사용 가능**

**목적**: 시뮬레이터용 빌드 (Apple Developer 계정 불필요)

**트리거**:
- `main` 또는 `develop` 브랜치에 push
- Pull Request 생성
- 수동 실행 (Actions 탭)

**결과물**:
- `.app` 파일 (Simulator용)
- 빌드 로그

**사용 사례**:
- PR 리뷰 시 빌드 검증
- 코드 변경 시 자동 테스트
- 개발 중 빠른 빌드 확인

---

### 2. `ios-build-release.yml` ⚠️ **Apple Developer 계정 필요**

**목적**: 실제 기기용 빌드 + TestFlight 배포

**트리거**:
- 수동 실행만 (기본 비활성화)
- 태그 push (설정 시: `v*`)

**결과물**:
- `.ipa` 파일 (실제 기기용)
- `.dSYM` 파일 (크래시 리포팅용)
- TestFlight 자동 업로드

**필수 요구사항**:
- ✅ Apple Developer Program 가입 ($99/년)
- ✅ App Store Connect API Key
- ✅ 코드 사이닝 인증서
- ✅ Provisioning Profile

---

## 🚀 빠른 시작 (시뮬레이터 빌드)

### Step 1: 코드 푸시
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

### Step 2: GitHub Actions 확인
1. GitHub 저장소 → **Actions** 탭 이동
2. **iOS Build (Simulator)** 워크플로우 확인
3. 약 10-15분 후 빌드 완료

### Step 3: 결과물 다운로드
1. 완료된 워크플로우 클릭
2. **Artifacts** 섹션에서 `StickerGuard-Simulator` 다운로드
3. `.app` 파일을 시뮬레이터에서 실행 가능

---

## 🔐 Release 빌드 설정 (TestFlight 배포)

### 1️⃣ Apple Developer 계정 준비

#### A. Apple Developer Program 가입
- https://developer.apple.com/programs/
- 비용: $99/년
- 처리 시간: 1-2일

#### B. App ID 생성
1. https://developer.apple.com/account/resources/identifiers
2. **Identifiers** → **+** 클릭
3. **App IDs** 선택
4. **Bundle ID**: `com.stickerguard` 입력
5. **Capabilities** 선택:
   - ✅ Push Notifications
   - ✅ Sign in with Apple (필요 시)
   - ✅ Associated Domains (필요 시)

#### C. 인증서 생성
1. **Certificates** → **+** 클릭
2. **Apple Distribution** 선택
3. CSR 파일 업로드 (키체인 접근 → 인증서 지원 → 인증 기관에서 인증서 요청)
4. 다운로드: `distribution_certificate.cer`

#### D. Provisioning Profile 생성
1. **Profiles** → **+** 클릭
2. **App Store** 선택
3. **App ID**: `com.stickerguard` 선택
4. **Certificate**: 위에서 생성한 인증서 선택
5. 다운로드: `StickerGuard_AppStore.mobileprovision`

---

### 2️⃣ App Store Connect API Key 생성

1. https://appstoreconnect.apple.com/access/api 접속
2. **Keys** → **+** 생성
3. **Name**: `GitHub Actions`
4. **Access**: `Developer` 선택
5. **Download** 클릭: `AuthKey_XXXXXXXXXX.p8` 저장
6. **Issuer ID** 및 **Key ID** 복사

---

### 3️⃣ GitHub Secrets 설정

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**

다음 Secrets를 추가하세요:

#### 필수 Secrets

| Secret 이름 | 설명 | 생성 방법 |
|-------------|------|----------|
| `BUILD_CERTIFICATE_BASE64` | 코드 사이닝 인증서 (Base64) | 아래 명령어 참조 |
| `P12_PASSWORD` | P12 파일 비밀번호 | 키체인에서 export 시 설정한 비밀번호 |
| `KEYCHAIN_PASSWORD` | 임시 키체인 비밀번호 | 임의의 강력한 비밀번호 (예: `Temp1234!@#$`) |
| `BUILD_PROVISION_PROFILE_BASE64` | Provisioning Profile (Base64) | 아래 명령어 참조 |
| `APPLE_TEAM_ID` | Apple Developer Team ID | https://developer.apple.com/account → Membership → Team ID |
| `PROVISIONING_PROFILE_NAME` | Provisioning Profile 이름 | 예: `StickerGuard AppStore` |
| `APP_STORE_CONNECT_API_KEY_ID` | API Key ID | App Store Connect에서 생성한 Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | API Issuer ID | App Store Connect에서 확인 |
| `APP_STORE_CONNECT_API_KEY_BASE64` | API Key (Base64) | 아래 명령어 참조 |

#### Base64 인코딩 명령어

**macOS에서 실행**:

```bash
# 1. 인증서를 P12로 export (키체인 접근 앱에서)
# "내 인증서" → 배포 인증서 우클릭 → "내보내기"
# 비밀번호 설정: 예) MyP12Pass123

# 2. P12를 Base64로 인코딩
base64 -i distribution_certificate.p12 | pbcopy
# → BUILD_CERTIFICATE_BASE64에 붙여넣기

# 3. Provisioning Profile을 Base64로 인코딩
base64 -i StickerGuard_AppStore.mobileprovision | pbcopy
# → BUILD_PROVISION_PROFILE_BASE64에 붙여넣기

# 4. API Key를 Base64로 인코딩
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
# → APP_STORE_CONNECT_API_KEY_BASE64에 붙여넣기
```

---

### 4️⃣ ExportOptions.plist 업데이트

`ios/ExportOptions.plist` 파일에서 다음 값을 수정:

```xml
<key>teamID</key>
<string>YOUR_TEAM_ID</string>  <!-- Apple Developer Team ID로 변경 -->

<key>provisioningProfiles</key>
<dict>
    <key>com.stickerguard</key>
    <string>StickerGuard AppStore</string>  <!-- Provisioning Profile 이름으로 변경 -->
</dict>
```

---

### 5️⃣ 워크플로우 활성화

`.github/workflows/ios-build-release.yml` 파일에서 주석 제거:

**Before**:
```yaml
on:
  # push:
  #   tags:
  #     - 'v*'
  # workflow_dispatch:
  workflow_dispatch:  # 수동 실행만 허용
```

**After** (태그 push 시 자동 배포):
```yaml
on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
```

---

### 6️⃣ 빌드 실행

#### 방법 1: 수동 실행
1. GitHub → **Actions** 탭
2. **iOS Build & Deploy (Release)** 선택
3. **Run workflow** 클릭

#### 방법 2: 태그로 자동 실행
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 📊 빌드 결과 확인

### 성공 시
- ✅ **Artifacts**: `.ipa` 및 `.dSYM` 파일 다운로드 가능
- ✅ **TestFlight**: App Store Connect에서 빌드 확인 (약 5-10분 후)

### 실패 시
1. **Actions** → 실패한 워크플로우 클릭
2. 빨간색 단계 클릭하여 에러 로그 확인
3. 일반적인 에러:
   - ❌ **Code signing error**: Secrets 값 재확인
   - ❌ **Profile not found**: Provisioning Profile 이름 확인
   - ❌ **Invalid API key**: App Store Connect API Key 재생성

---

## 🔧 문제 해결

### Q1. "No matching provisioning profiles found"

**원인**: Provisioning Profile이 Bundle ID와 일치하지 않음

**해결**:
1. Bundle ID가 정확한지 확인: `com.stickerguard`
2. Provisioning Profile 재생성
3. `PROVISIONING_PROFILE_NAME` Secret 업데이트

---

### Q2. "Code signing identity not found"

**원인**: 인증서가 올바르게 import되지 않음

**해결**:
1. P12 파일 재생성 (키체인에서 export)
2. `BUILD_CERTIFICATE_BASE64` Base64 인코딩 재확인
3. `P12_PASSWORD` 비밀번호 재확인

---

### Q3. "API authentication failed"

**원인**: App Store Connect API Key 오류

**해결**:
1. API Key가 만료되지 않았는지 확인
2. **Issuer ID** 및 **Key ID** 재확인
3. API Key 권한 확인 (최소 Developer 권한)

---

### Q4. TestFlight에 업로드되지 않음

**원인**: `altool` 업로드 실패

**해결**:
1. App Store Connect에서 앱이 생성되어 있는지 확인
2. Bundle ID가 일치하는지 확인
3. API Key 권한 재확인

---

## 💡 팁 & 모범 사례

### 보안
- ✅ **절대 인증서를 코드에 포함하지 마세요**
- ✅ **GitHub Secrets만 사용**
- ✅ **API Key는 최소 권한으로 생성**

### 효율성
- ✅ **Simulator 빌드로 먼저 검증**
- ✅ **Release 빌드는 태그로만 실행**
- ✅ **캐싱 활용** (npm, CocoaPods)

### 버전 관리
- ✅ **Semantic Versioning 사용**: `v1.0.0`, `v1.1.0`
- ✅ **빌드 번호 자동 증가**: Xcode 설정에서 관리

---

## 📚 참고 자료

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
- [GitHub Actions - iOS/macOS](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-swift)
- [Fastlane (alternative)](https://fastlane.tools/)

---

## 🆘 지원

문제가 발생하면 다음을 확인하세요:

1. **Actions 로그**: 상세한 에러 메시지 확인
2. **Apple Developer Portal**: 인증서/프로파일 상태 확인
3. **App Store Connect**: 앱 상태 및 빌드 확인

---

**마지막 업데이트**: 2025-11-02
