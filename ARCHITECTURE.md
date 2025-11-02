# 스티커 가드 앱 - 시스템 아키텍처 설계서

## 📋 문서 정보
- **작성일**: 2025.11.02
- **버전**: 1.0
- **프로젝트**: Sticker Guard iOS App
- **회사 위치**: 37.2253811, 127.0706423 (300m 반경)

---

## 🏗️ 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      iOS 앱 (React Native)                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │  Presentation │  │   Business    │  │   Data Layer    │ │
│  │     Layer     │──│     Logic     │──│                 │ │
│  │   (UI/UX)     │  │    Layer      │  │  (Local/Remote) │ │
│  └───────────────┘  └───────────────┘  └─────────────────┘ │
│         │                   │                    │           │
│         │                   │                    │           │
│  ┌──────▼───────────────────▼────────────────────▼────────┐ │
│  │           Native Modules (iOS Bridge)                  │ │
│  │  - Location Service   - Camera Service                 │ │
│  │  - Notification       - Background Tasks               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Backend                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Authentication│  │  Firestore   │  │ Cloud Functions  │  │
│  │  (익명 인증)  │  │ (실시간 DB)  │  │ (서버 로직)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │     FCM      │  │  Analytics   │  │   App Check      │  │
│  │ (푸시 알림)   │  │  (분석)      │  │  (보안)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 앱 계층 구조 (3-Tier Architecture)

### Layer 1: Presentation Layer (UI/UX)

**역할**: 사용자 인터페이스 및 사용자 인터랙션

```
src/
├── screens/                    # 화면 컴포넌트
│   ├── onboarding/            # 온보딩 플로우
│   │   ├── WelcomeScreen.tsx
│   │   ├── LocationSetupScreen.tsx
│   │   ├── PermissionsScreen.tsx
│   │   └── TestCheckInScreen.tsx
│   │
│   ├── main/                  # 메인 앱 화면
│   │   ├── HomeScreen.tsx
│   │   ├── CheckInScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   └── lock/                  # 계정 잠금
│       └── AccountLockedScreen.tsx
│
├── components/                 # 재사용 가능한 UI 컴포넌트
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Modal.tsx
│   │
│   ├── checkin/
│   │   ├── CameraView.tsx
│   │   ├── CheckInGuide.tsx
│   │   └── CheckInResult.tsx
│   │
│   └── stats/
│       ├── StreakDisplay.tsx
│       ├── BadgeCard.tsx
│       └── MonthlyChart.tsx
│
└── navigation/                 # 네비게이션 구조
    ├── RootNavigator.tsx
    ├── OnboardingNavigator.tsx
    └── MainNavigator.tsx
```

### Layer 2: Business Logic Layer

**역할**: 비즈니스 로직, 상태 관리, 데이터 처리

```
src/
├── stores/                     # 상태 관리 (Zustand)
│   ├── authStore.ts           # 인증 상태
│   ├── locationStore.ts       # 위치 상태
│   ├── checkInStore.ts        # 체크인 상태
│   ├── timerStore.ts          # 45분 타이머 상태
│   └── statsStore.ts          # 통계 상태
│
├── services/                   # 비즈니스 로직 서비스
│   ├── locationService.ts     # 위치 추적 로직
│   ├── checkInService.ts      # 체크인 검증 로직
│   ├── notificationService.ts # 알림 스케줄링
│   ├── timerService.ts        # 45분 타이머 관리
│   ├── lockService.ts         # 계정 잠금 로직
│   └── statsService.ts        # 통계 계산
│
├── hooks/                      # Custom React Hooks
│   ├── useLocationTracking.ts
│   ├── useCheckInTimer.ts
│   ├── useNotifications.ts
│   └── useStats.ts
│
└── utils/                      # 유틸리티 함수
    ├── dateUtils.ts
    ├── locationUtils.ts
    ├── validationUtils.ts
    └── constants.ts
```

### Layer 3: Data Layer

**역할**: 데이터 저장, 네트워크 통신, 로컬 캐싱

```
src/
├── api/                        # Firebase API 통신
│   ├── firebase.ts            # Firebase 초기화
│   ├── authApi.ts             # 인증 API
│   ├── firestoreApi.ts        # Firestore CRUD
│   ├── functionsApi.ts        # Cloud Functions 호출
│   └── fcmApi.ts              # FCM 푸시 알림
│
├── models/                     # 데이터 모델 (TypeScript 타입)
│   ├── User.ts
│   ├── CheckIn.ts
│   ├── Stats.ts
│   └── Notification.ts
│
└── storage/                    # 로컬 저장소
    ├── asyncStorage.ts        # 비동기 저장소
    └── secureStorage.ts       # 보안 저장소
```

---

## 🔄 핵심 데이터 흐름

### 1. 위치 추적 및 체크인 트리거

```
┌─────────────────────────────────────────────────────────┐
│ 1. Native Location Service (백그라운드)                 │
│    - iOS Core Location (항상 허용)                      │
│    - Geofencing: 37.2253811, 127.0706423 (반경 300m)  │
└────────────────┬────────────────────────────────────────┘
                 │ 위치 이벤트
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Location Service (JS)                                │
│    - 회사 반경 진입 감지                                 │
│    - lastEnteredCompany 타임스탬프 저장                 │
│    - checkInDeadline = now + 45분 계산                  │
└────────────────┬────────────────────────────────────────┘
                 │ 진입 이벤트
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Timer Service                                        │
│    - 45분 카운트다운 시작                               │
│    - Firestore에 deadline 저장                         │
│    - 로컬 타이머 + Cloud Functions 백업                │
└────────────────┬────────────────────────────────────────┘
                 │ 타이머 시작
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Notification Service                                 │
│    - 0분: "입문 전 체크 필수" (즉시)                    │
│    - 5분: "아직 체크 안 함" (5분 후 스케줄)            │
│    - 15분: "앱 사용 불가 경고" (15분 후)               │
│    - 30분: "마지막 경고" (30분 후)                     │
│    - 45분: 타임아웃 → Lock Service 호출                │
└─────────────────────────────────────────────────────────┘
```

### 2. 카메라 체크인 프로세스

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Action: "체크하기" 버튼 클릭                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Camera Service                                       │
│    - react-native-vision-camera 초기화                 │
│    - 후면 카메라 활성화                                 │
│    - 실시간 프리뷰 표시                                 │
└────────────────┬────────────────────────────────────────┘
                 │ 카메라 화면 표시
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. User Verification                                    │
│    - 사용자가 육안으로 스티커 확인                      │
│    - "스티커 있음" 또는 "스티커 없음" 선택             │
└────────────────┬────────────────────────────────────────┘
                 │ 선택 완료
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. CheckIn Service                                      │
│    - 체크인 결과 Firestore에 저장                      │
│    - checkedAt: 현재 타임스탬프                        │
│    - hasSticker: true/false                            │
│    - 타이머 중지 및 알림 취소                          │
└────────────────┬────────────────────────────────────────┘
                 │ 체크인 완료
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Stats Service                                        │
│    - currentStreak += 1 (연속 기록 증가)               │
│    - totalCheckIns += 1                                │
│    - 배지 획득 조건 확인                                │
│    - UI 업데이트                                        │
└─────────────────────────────────────────────────────────┘
```

### 3. 45분 타이머 만료 및 계정 잠금

```
┌─────────────────────────────────────────────────────────┐
│ 1. Timer Expiration (45분 경과)                         │
│    - 로컬 타이머 만료 감지                              │
│    - Cloud Functions도 동시 체크 (백업)                │
└────────────────┬────────────────────────────────────────┘
                 │ 타임아웃
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Lock Service                                         │
│    - accountStatus = 'locked' (Firestore 업데이트)     │
│    - 데이터 삭제 트리거                                 │
└────────────────┬────────────────────────────────────────┘
                 │ 잠금 실행
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Data Deletion (Cloud Functions)                      │
│    - checkIns 컬렉션 전체 삭제                         │
│    - stats 문서 초기화                                  │
│    - 로컬 AsyncStorage 클리어                          │
│    - 잠금 화면으로 강제 이동                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Firebase Firestore 데이터베이스 스키마

### Collection: `users`

```typescript
// users/{userId}
interface User {
  userId: string;                    // 익명 인증 UID
  companyLocation: {
    latitude: number;                // 37.2253811
    longitude: number;               // 127.0706423
    radius: number;                  // 300 (미터)
  };
  accountStatus: 'active' | 'locked';
  createdAt: Timestamp;
  lastEnteredCompany: Timestamp | null;  // 회사 진입 시각
  checkInDeadline: Timestamp | null;     // 체크인 마감 시각 (진입 + 45분)
}
```

### SubCollection: `users/{userId}/checkIns`

```typescript
// users/{userId}/checkIns/{date}
interface CheckIn {
  date: string;                      // 'YYYY-MM-DD' 형식
  checkedAt: Timestamp | null;       // 체크인 완료 시각
  hasSticker: boolean;               // 스티커 부착 여부
  enteredAt: Timestamp;              // 회사 진입 시각
}
```

### SubCollection: `users/{userId}/stats`

```typescript
// users/{userId}/stats/current
interface Stats {
  currentStreak: number;             // 현재 연속 기록
  longestStreak: number;             // 최장 연속 기록
  totalCheckIns: number;             // 총 체크인 횟수
  perfectWeeks: number;              // 완벽한 주 (5일 연속)
  badges: string[];                  // 획득한 배지 목록
  monthlyStats: {
    [yearMonth: string]: {           // '2025-11'
      checkInDays: number;
      achievementRate: number;       // 달성률 (%)
    }
  };
}
```

---

## ⚙️ Cloud Functions 설계

### Function 1: `checkTimerExpiration`

**트리거**: Scheduled (1분 간격)

**역할**: 45분 타이머 만료 확인 및 계정 잠금

```typescript
// functions/src/checkTimerExpiration.ts
export const checkTimerExpiration = functions
  .pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    // 마감 시간이 지난 사용자 조회
    const expiredUsers = await admin.firestore()
      .collection('users')
      .where('accountStatus', '==', 'active')
      .where('checkInDeadline', '<=', now)
      .get();

    // 각 사용자에 대해 잠금 처리
    const batch = admin.firestore().batch();
    expiredUsers.forEach(doc => {
      batch.update(doc.ref, {
        accountStatus: 'locked',
        lockedAt: now,
      });
    });

    await batch.commit();

    // 데이터 삭제 트리거
    expiredUsers.forEach(async (doc) => {
      await deleteUserData(doc.id);
    });
  });
```

### Function 2: `deleteUserData`

**트리거**: Manual Call

**역할**: 계정 잠금 시 모든 데이터 삭제

```typescript
async function deleteUserData(userId: string) {
  const batch = admin.firestore().batch();

  // checkIns 서브컬렉션 삭제
  const checkIns = await admin.firestore()
    .collection(`users/${userId}/checkIns`)
    .get();

  checkIns.forEach(doc => batch.delete(doc.ref));

  // stats 초기화
  const statsRef = admin.firestore()
    .doc(`users/${userId}/stats/current`);

  batch.set(statsRef, {
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    perfectWeeks: 0,
    badges: [],
    monthlyStats: {},
  });

  await batch.commit();
}
```

### Function 3: `onCheckInComplete`

**트리거**: Firestore Write (checkIns 컬렉션)

**역할**: 체크인 완료 시 통계 업데이트

```typescript
export const onCheckInComplete = functions
  .firestore
  .document('users/{userId}/checkIns/{date}')
  .onWrite(async (change, context) => {
    const { userId } = context.params;

    // 체크인 완료 확인
    const afterData = change.after.data();
    if (!afterData?.checkedAt) return;

    // 통계 업데이트
    await updateStats(userId);

    // 타이머 및 알림 취소
    await cancelTimer(userId);
  });
```

---

## 📡 네트워크 및 통신 구조

### REST API (Firebase Functions)

```
POST /api/auth/anonymous          # 익명 인증
GET  /api/user/{userId}           # 사용자 정보 조회
PUT  /api/user/{userId}/location  # 회사 위치 설정

POST /api/checkin                 # 체크인 생성
GET  /api/checkin/today           # 오늘 체크인 조회

GET  /api/stats                   # 통계 조회
GET  /api/stats/badges            # 배지 목록 조회
```

### WebSocket (Firestore Realtime)

```typescript
// 실시간 타이머 동기화
firestore()
  .collection('users')
  .doc(userId)
  .onSnapshot(snapshot => {
    const checkInDeadline = snapshot.data()?.checkInDeadline;
    // 타이머 UI 업데이트
  });

// 실시간 계정 상태 감시
firestore()
  .collection('users')
  .doc(userId)
  .onSnapshot(snapshot => {
    const accountStatus = snapshot.data()?.accountStatus;
    if (accountStatus === 'locked') {
      // 잠금 화면으로 강제 이동
      navigation.replace('AccountLocked');
    }
  });
```

---

## 🔔 알림 시스템 아키텍처

### Local Notifications (@notifee/react-native)

```typescript
// 알림 스케줄링 전략
const scheduleNotifications = (enteredAt: Date) => {
  const notifications = [
    { delay: 0,     title: '💚 입문 전 체크 필수!', priority: 'default' },
    { delay: 5,     title: '⚠️ 아직 체크 안 함', priority: 'high' },
    { delay: 15,    title: '🚨 앱 사용 불가 경고', priority: 'high' },
    { delay: 30,    title: '❗ 마지막 경고', priority: 'max' },
  ];

  notifications.forEach(notif => {
    notifee.createTriggerNotification(
      {
        title: notif.title,
        body: `${45 - notif.delay}분 남았습니다`,
        android: {
          channelId: 'urgent',
          importance: AndroidImportance.HIGH,
        },
        ios: {
          sound: 'urgent.wav',
          criticalVolume: 1.0,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: enteredAt.getTime() + (notif.delay * 60 * 1000),
      }
    );
  });
};
```

---

## 🔒 보안 아키텍처

### 1. 익명 인증 플로우

```
앱 최초 실행
  → Firebase Anonymous Auth
  → 디바이스별 고유 UID 생성
  → Firestore에 사용자 문서 생성
  → 로컬에 UID 저장 (AsyncStorage)
```

### 2. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users 컬렉션
    match /users/{userId} {
      // 자신의 문서만 읽기/쓰기 가능
      allow read, write: if request.auth.uid == userId;

      // checkIns 서브컬렉션
      match /checkIns/{date} {
        allow read, write: if request.auth.uid == userId;
      }

      // stats 서브컬렉션
      match /stats/{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

### 3. 데이터 암호화

```typescript
// AsyncStorage에 저장되는 민감 데이터는 암호화
import EncryptedStorage from 'react-native-encrypted-storage';

// 사용자 UID 암호화 저장
await EncryptedStorage.setItem('user_uid', userId);

// 회사 위치 암호화 저장
await EncryptedStorage.setItem('company_location', JSON.stringify({
  latitude: 37.2253811,
  longitude: 127.0706423,
}));
```

---

## 📊 성능 최적화 전략

### 1. 배터리 최적화

```typescript
// Geofencing 사용으로 배터리 절약
const geofence = {
  identifier: 'company',
  latitude: 37.2253811,
  longitude: 127.0706423,
  radius: 300,
  notifyOnEntry: true,
  notifyOnExit: true,
};

// GPS 업데이트 주기 최소화
const locationConfig = {
  distanceFilter: 50,           // 50m 이동 시에만 업데이트
  desiredAccuracy: 'balanced',  // 배터리와 정확도 균형
  interval: 900000,             // 15분 간격 (밀리초)
};
```

### 2. 메모리 최적화

```typescript
// 이미지 최적화
import FastImage from 'react-native-fast-image';

// 캐싱 전략
const imageCache = FastImage.preload([
  { uri: 'sticker_icon.png' },
  { uri: 'badge_7days.png' },
]);

// 리스트 가상화 (통계 화면)
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={checkInHistory}
  estimatedItemSize={80}
  renderItem={renderCheckInItem}
/>
```

### 3. 네트워크 최적화

```typescript
// Firestore 오프라인 지속성
firestore().settings({
  persistence: true,
  cacheSizeBytes: 40 * 1024 * 1024, // 40MB 캐시
});

// 쿼리 최적화 (인덱스 사용)
firestore()
  .collection('users')
  .doc(userId)
  .collection('checkIns')
  .orderBy('date', 'desc')
  .limit(30); // 최근 30일만 조회
```

---

## 🧪 테스트 전략

### 1. Unit Tests (Jest)

```typescript
// 타이머 로직 테스트
describe('TimerService', () => {
  it('should calculate deadline correctly', () => {
    const enteredAt = new Date('2025-11-02T09:00:00');
    const deadline = calculateDeadline(enteredAt);
    expect(deadline).toEqual(new Date('2025-11-02T09:45:00'));
  });
});

// 위치 거리 계산 테스트
describe('LocationUtils', () => {
  it('should detect within 300m radius', () => {
    const companyLocation = { lat: 37.2253811, lng: 127.0706423 };
    const userLocation = { lat: 37.2255000, lng: 127.0708000 };
    const distance = calculateDistance(companyLocation, userLocation);
    expect(distance).toBeLessThan(300);
  });
});
```

### 2. Integration Tests

```typescript
// 체크인 플로우 통합 테스트
describe('CheckIn Flow', () => {
  it('should complete check-in successfully', async () => {
    // 1. 회사 진입
    await locationService.enterCompany();

    // 2. 타이머 시작 확인
    const timer = timerStore.getState().activeTimer;
    expect(timer).toBeDefined();

    // 3. 체크인 수행
    await checkInService.completeCheckIn(true);

    // 4. 통계 업데이트 확인
    const stats = await statsService.getStats();
    expect(stats.currentStreak).toBe(1);
  });
});
```

### 3. E2E Tests (Detox)

```typescript
// 전체 플로우 E2E 테스트
describe('Complete User Journey', () => {
  it('should complete onboarding and first check-in', async () => {
    // 온보딩
    await element(by.id('welcome-start-btn')).tap();
    await element(by.id('location-current-btn')).tap();
    await element(by.id('permissions-allow-btn')).tap();

    // 첫 체크인
    await element(by.id('test-checkin-btn')).tap();
    await element(by.id('camera-open-btn')).tap();
    await element(by.id('sticker-yes-btn')).tap();

    // 결과 확인
    await expect(element(by.text('체크 완료!'))).toBeVisible();
  });
});
```

---

## 🚀 배포 파이프라인

```
┌─────────────────────────────────────────────────────┐
│  1. Development (로컬)                               │
│     - 코드 작성 및 로컬 테스트                       │
│     - Firebase Emulator 사용                        │
└────────────────┬────────────────────────────────────┘
                 │ git push
                 ▼
┌─────────────────────────────────────────────────────┐
│  2. CI/CD (GitHub Actions)                          │
│     - 자동 빌드                                      │
│     - Unit Tests 실행                               │
│     - Integration Tests 실행                        │
│     - E2E Tests 실행 (Detox)                        │
└────────────────┬────────────────────────────────────┘
                 │ tests pass
                 ▼
┌─────────────────────────────────────────────────────┐
│  3. Staging (TestFlight)                            │
│     - 내부 테스터 배포                               │
│     - 베타 테스트 (50명)                            │
│     - 피드백 수집                                    │
└────────────────┬────────────────────────────────────┘
                 │ approval
                 ▼
┌─────────────────────────────────────────────────────┐
│  4. Production (App Store)                          │
│     - 정식 출시                                      │
│     - 모니터링 (Firebase Analytics)                 │
│     - 크래시 리포팅 (Crashlytics)                   │
└─────────────────────────────────────────────────────┘
```

---

## 📈 모니터링 및 관찰성

### 1. Firebase Analytics

```typescript
// 주요 이벤트 추적
analytics().logEvent('company_entered', {
  timestamp: Date.now(),
  location: 'company_hq',
});

analytics().logEvent('checkin_completed', {
  streak: currentStreak,
  duration: checkInDuration,
});

analytics().logEvent('account_locked', {
  reason: 'timer_expired',
  streak_lost: streakLost,
});
```

### 2. Crashlytics

```typescript
// 크래시 리포팅
crashlytics().log('Timer expired, attempting lock');
crashlytics().recordError(error);

// 커스텀 키 설정
crashlytics().setUserId(userId);
crashlytics().setAttribute('streak', String(currentStreak));
```

### 3. Performance Monitoring

```typescript
// 성능 추적
const trace = perf().startTrace('checkin_flow');
await checkInService.completeCheckIn();
await trace.stop();

// 네트워크 요청 추적
perf().setPerformanceCollectionEnabled(true);
```

---

## 🔄 시스템 흐름도 요약

```
앱 실행
  ↓
온보딩 (최초 1회)
  ↓
홈 화면 (대기 상태)
  ↓
[백그라운드] 위치 추적
  ↓
회사 300m 진입 감지
  ↓
45분 타이머 시작
  ↓
알림 발송 (0, 5, 15, 30분)
  ↓
사용자 체크인 수행
  ├─ 완료 → 통계 업데이트 → 홈 화면
  └─ 미완료 → 45분 경과 → 계정 잠금 → 잠금 화면
```

---

## 📚 기술 스택 최종 결정

| 레이어 | 기술 | 버전 | 선정 이유 |
|--------|------|------|----------|
| **Frontend Framework** | React Native | 0.74.0 | iOS 개발 속도, Firebase 연동 용이 |
| **Language** | TypeScript | 5.3.0 | 타입 안정성, 개발 생산성 |
| **State Management** | Zustand | 4.5.0 | 가벼움, 간단한 API |
| **Navigation** | React Navigation | 6.x | 표준, 커뮤니티 지원 |
| **Backend** | Firebase | - | 빠른 구축, 실시간 DB, 무료 시작 |
| **Location** | react-native-geolocation-service | 5.3.1 | 안정적, iOS 최적화 |
| **Camera** | react-native-vision-camera | 3.8.0 | 최신, 성능 우수 |
| **Notifications** | @notifee/react-native | 7.8.2 | 가장 강력한 로컬 알림 |
| **Storage** | @react-native-async-storage | 1.21.0 | 표준 비동기 저장소 |
| **Secure Storage** | react-native-encrypted-storage | 4.0.3 | 민감 데이터 암호화 |
| **Testing** | Jest + Detox | - | 단위/통합/E2E 테스트 |

---

**문서 작성 완료**
