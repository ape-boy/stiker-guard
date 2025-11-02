# 스티커 가드 앱 - 상세 기능 명세서

## 📋 문서 정보
- **작성일**: 2025.11.02
- **버전**: 1.0
- **대상**: 개발자
- **목적**: 각 기능의 상세 구현 사양 정의

---

## 🎯 기능 1: 위치 추적 시스템

### 1.1 기능 개요
- 회사 위치 (37.2253811, 127.0706423) 300m 반경 감지
- 백그라운드에서 24시간 추적
- 진입/이탈 이벤트 감지

### 1.2 기술 스펙

**Native Module**: iOS Core Location Framework

```swift
// iOS/LocationManager.swift
import CoreLocation

class LocationManager: NSObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    private let companyCenter = CLLocationCoordinate2D(
        latitude: 37.2253811,
        longitude: 127.0706423
    )
    private let radius: CLLocationDistance = 300.0

    func startMonitoring() {
        // 권한 요청 (항상 허용 필요)
        locationManager.requestAlwaysAuthorization()

        // Geofencing 설정
        let region = CLCircularRegion(
            center: companyCenter,
            radius: radius,
            identifier: "company_region"
        )
        region.notifyOnEntry = true
        region.notifyOnExit = true

        locationManager.startMonitoring(for: region)

        // 백그라운드 위치 업데이트
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager.distanceFilter = 50.0 // 50m마다 업데이트
    }

    // 진입 이벤트
    func locationManager(
        _ manager: CLLocationManager,
        didEnterRegion region: CLRegion
    ) {
        sendEventToReactNative("onCompanyEnter", body: [
            "timestamp": Date().timeIntervalSince1970,
            "latitude": companyCenter.latitude,
            "longitude": companyCenter.longitude
        ])
    }

    // 이탈 이벤트
    func locationManager(
        _ manager: CLLocationManager,
        didExitRegion region: CLRegion
    ) {
        sendEventToReactNative("onCompanyExit", body: [
            "timestamp": Date().timeIntervalSince1970
        ])
    }
}
```

**React Native Bridge**:

```typescript
// src/services/locationService.ts
import { NativeEventEmitter, NativeModules } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useLocationStore } from '../stores/locationStore';
import { timerService } from './timerService';

const { LocationManager } = NativeModules;
const locationEmitter = new NativeEventEmitter(LocationManager);

export class LocationService {
  private isMonitoring = false;

  async startMonitoring(userId: string) {
    if (this.isMonitoring) return;

    // 권한 확인
    const permission = await LocationManager.checkPermission();
    if (permission !== 'always') {
      throw new Error('위치 권한(항상 허용)이 필요합니다');
    }

    // 네이티브 모니터링 시작
    await LocationManager.startMonitoring();
    this.isMonitoring = true;

    // 진입 이벤트 리스너
    locationEmitter.addListener('onCompanyEnter', async (event) => {
      console.log('회사 진입 감지:', event);

      // 당일 이미 체크했는지 확인
      const today = new Date().toISOString().split('T')[0];
      const checkIn = await firestore()
        .collection('users')
        .doc(userId)
        .collection('checkIns')
        .doc(today)
        .get();

      if (checkIn.exists && checkIn.data()?.checkedAt) {
        console.log('오늘 이미 체크 완료');
        return;
      }

      // 45분 타이머 시작
      const enteredAt = new Date(event.timestamp * 1000);
      const deadline = new Date(enteredAt.getTime() + 45 * 60 * 1000);

      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          lastEnteredCompany: firestore.Timestamp.fromDate(enteredAt),
          checkInDeadline: firestore.Timestamp.fromDate(deadline),
        });

      // 알림 스케줄링
      await timerService.startTimer(userId, deadline);

      // 상태 업데이트
      useLocationStore.getState().setEntered(true);
    });

    // 이탈 이벤트 리스너
    locationEmitter.addListener('onCompanyExit', (event) => {
      console.log('회사 이탈 감지:', event);
      useLocationStore.getState().setEntered(false);
    });
  }

  async stopMonitoring() {
    await LocationManager.stopMonitoring();
    this.isMonitoring = false;
    locationEmitter.removeAllListeners('onCompanyEnter');
    locationEmitter.removeAllListeners('onCompanyExit');
  }

  // 현재 위치와 회사 거리 계산
  async getDistanceToCompany(): Promise<number> {
    const currentLocation = await LocationManager.getCurrentLocation();
    return this.calculateDistance(
      { lat: 37.2253811, lng: 127.0706423 },
      { lat: currentLocation.latitude, lng: currentLocation.longitude }
    );
  }

  // Haversine 공식으로 거리 계산 (미터 단위)
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위 거리
  }
}

export const locationService = new LocationService();
```

### 1.3 Info.plist 권한 설정

```xml
<!-- iOS/StickerGuard/Info.plist -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>회사 도착 시 자동으로 스티커 체크 알림을 보내기 위해 위치 권한이 필요합니다.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>회사 위치 설정을 위해 현재 위치가 필요합니다.</string>

<key>UIBackgroundModes</key>
<array>
    <string>location</string>
</array>
```

### 1.4 배터리 최적화 전략

- **Geofencing 우선 사용**: GPS 대신 Geofence 이벤트만 감지 (배터리 절약)
- **거리 필터**: 50m 이상 이동 시에만 위치 업데이트
- **정확도 조정**: `kCLLocationAccuracyHundredMeters` (100m 정확도로 충분)
- **백그라운드 최소화**: 진입/이탈 시에만 JavaScript 실행

**예상 배터리 소모**: 하루 3-5%

---

## 📸 기능 2: 카메라 검증 시스템

### 2.1 기능 개요
- 후면 카메라 실시간 프리뷰
- 사용자 육안 확인 후 수동 선택
- iOS 정책 준수 (명시적 사용자 액션)

### 2.2 기술 스펙

**라이브러리**: `react-native-vision-camera` v3.8.0

```typescript
// src/components/checkin/CameraView.tsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { checkInService } from '../../services/checkInService';

export const CameraView: React.FC = () => {
  const device = useCameraDevice('back'); // 후면 카메라
  const camera = useRef<Camera>(null);
  const [hasPermission, setHasPermission] = useState(false);

  React.useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
    })();
  }, []);

  const handleStickerYes = async () => {
    try {
      await checkInService.completeCheckIn({
        hasSticker: true,
        timestamp: new Date(),
      });
      // 결과 화면으로 이동
      navigation.navigate('CheckInResult', { success: true });
    } catch (error) {
      console.error('체크인 실패:', error);
    }
  };

  const handleStickerNo = () => {
    // 실패 결과 화면
    navigation.navigate('CheckInResult', { success: false });
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>카메라 권한이 필요합니다</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text>카메라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카메라 프리뷰 */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={false}
        video={false}
      />

      {/* 오버레이 UI */}
      <View style={styles.overlay}>
        <Text style={styles.title}>스티커가 부착되어 있나요?</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.yesButton]}
            onPress={handleStickerYes}
          >
            <Text style={styles.buttonText}>✓ 스티커 있음</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={handleStickerNo}
          >
            <Text style={styles.buttonText}>✗ 스티커 없음</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#4CAF50',
  },
  noButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
```

### 2.3 Info.plist 권한 설정

```xml
<key>NSCameraUsageDescription</key>
<string>카메라 스티커 부착 여부를 확인하기 위해 카메라 권한이 필요합니다.</string>
```

---

## ⏱️ 기능 3: 45분 타이머 & 알림 시스템

### 3.1 기능 개요
- 회사 진입 시 45분 카운트다운 시작
- 0분, 5분, 15분, 30분 알림 발송
- 45분 경과 시 계정 잠금

### 3.2 기술 스펙

**알림 라이브러리**: `@notifee/react-native` v7.8.2

```typescript
// src/services/timerService.ts
import notifee, {
  TriggerType,
  AndroidImportance,
  TimestampTrigger,
} from '@notifee/react-native';
import firestore from '@react-native-firebase/firestore';
import { useTimerStore } from '../stores/timerStore';
import { lockService } from './lockService';

export class TimerService {
  private timerId: NodeJS.Timeout | null = null;

  async startTimer(userId: string, deadline: Date) {
    console.log('45분 타이머 시작:', deadline);

    // 상태 업데이트
    useTimerStore.getState().startTimer(deadline);

    // 알림 스케줄링
    await this.scheduleNotifications(deadline);

    // 로컬 타이머 (백업)
    this.startLocalTimer(userId, deadline);

    // Firestore에 저장 (Cloud Functions 백업용)
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        checkInDeadline: firestore.Timestamp.fromDate(deadline),
      });
  }

  private async scheduleNotifications(deadline: Date) {
    const now = Date.now();

    const notifications = [
      {
        id: 'notify-0min',
        delay: 0,
        title: '💚 입문 전 스티커 체크 필수!',
        body: '45분 내에 체크하지 않으면 계정이 잠깁니다',
        importance: AndroidImportance.DEFAULT,
      },
      {
        id: 'notify-5min',
        delay: 5 * 60 * 1000,
        title: '⚠️ 아직 체크 안 하셨어요',
        body: '40분 남았습니다. 지금 바로 체크하세요!',
        importance: AndroidImportance.HIGH,
      },
      {
        id: 'notify-15min',
        delay: 15 * 60 * 1000,
        title: '🚨 앱 사용 불가 경고!',
        body: '30분 남았습니다. 체크하지 않으면 모든 데이터가 삭제됩니다!',
        importance: AndroidImportance.HIGH,
      },
      {
        id: 'notify-30min',
        delay: 30 * 60 * 1000,
        title: '❗❗ 마지막 경고!',
        body: '15분 남았습니다! 지금 체크하지 않으면 계정이 잠깁니다!',
        importance: AndroidImportance.MAX,
      },
    ];

    // 알림 채널 생성 (Android)
    const channelId = await notifee.createChannel({
      id: 'checkin-reminders',
      name: '체크인 알림',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // 각 알림 스케줄링
    for (const notif of notifications) {
      const triggerTime = now + notif.delay;

      // 이미 지난 시간이면 스킵
      if (triggerTime > deadline.getTime()) continue;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerTime,
      };

      await notifee.createTriggerNotification(
        {
          id: notif.id,
          title: notif.title,
          body: notif.body,
          android: {
            channelId,
            importance: notif.importance,
            pressAction: {
              id: 'open-checkin',
              launchActivity: 'default',
            },
            sound: 'default',
            vibrationPattern: [300, 500, 300, 500],
          },
          ios: {
            sound: 'default',
            criticalVolume: 1.0,
            interruptionLevel: 'timeSensitive',
          },
        },
        trigger
      );

      console.log(`알림 스케줄: ${notif.id} at ${new Date(triggerTime)}`);
    }
  }

  private startLocalTimer(userId: string, deadline: Date) {
    // 기존 타이머 취소
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    const delay = deadline.getTime() - Date.now();

    // 45분 후 실행
    this.timerId = setTimeout(async () => {
      console.log('45분 타이머 만료 - 계정 잠금 실행');
      await lockService.lockAccount(userId, '45분 내 체크 미완료');
    }, delay);
  }

  async cancelTimer(userId: string) {
    console.log('타이머 취소');

    // 로컬 타이머 취소
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    // 모든 예약된 알림 취소
    await notifee.cancelAllNotifications();

    // 상태 초기화
    useTimerStore.getState().stopTimer();

    // Firestore 업데이트
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        checkInDeadline: null,
      });
  }

  // 남은 시간 계산 (초 단위)
  getRemainingTime(deadline: Date): number {
    const now = Date.now();
    const remaining = deadline.getTime() - now;
    return Math.max(0, Math.floor(remaining / 1000));
  }
}

export const timerService = new TimerService();
```

### 3.3 Cloud Functions 백업 타이머

```typescript
// functions/src/checkTimerExpiration.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const checkTimerExpiration = functions
  .pubsub
  .schedule('every 1 minutes')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    // 마감 시간이 지난 사용자 조회
    const expiredUsers = await admin.firestore()
      .collection('users')
      .where('accountStatus', '==', 'active')
      .where('checkInDeadline', '<=', now)
      .get();

    console.log(`만료된 사용자 ${expiredUsers.size}명 발견`);

    if (expiredUsers.empty) return;

    // 계정 잠금 처리
    const batch = admin.firestore().batch();

    expiredUsers.forEach(doc => {
      batch.update(doc.ref, {
        accountStatus: 'locked',
        lockedAt: now,
        lockReason: '45분 내 체크 미완료',
      });
    });

    await batch.commit();

    // 각 사용자 데이터 삭제
    const deletePromises = expiredUsers.docs.map(doc =>
      deleteUserData(doc.id)
    );

    await Promise.all(deletePromises);

    console.log('계정 잠금 처리 완료');
  });

async function deleteUserData(userId: string) {
  const db = admin.firestore();
  const batch = db.batch();

  // checkIns 서브컬렉션 삭제
  const checkIns = await db
    .collection('users')
    .doc(userId)
    .collection('checkIns')
    .get();

  checkIns.forEach(doc => batch.delete(doc.ref));

  // stats 초기화
  const statsRef = db
    .collection('users')
    .doc(userId)
    .collection('stats')
    .doc('current');

  batch.set(statsRef, {
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    perfectWeeks: 0,
    badges: [],
    monthlyStats: {},
    deletedAt: admin.firestore.Timestamp.now(),
  });

  await batch.commit();
  console.log(`사용자 ${userId} 데이터 삭제 완료`);
}
```

---

## 🔒 기능 4: 계정 잠금 시스템

### 4.1 기능 개요
- 45분 타이머 만료 시 자동 실행
- 모든 데이터 삭제 (연속 기록, 통계, 배지)
- 앱 재설치 필요

### 4.2 기술 스펙

```typescript
// src/services/lockService.ts
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/authStore';
import { Alert } from 'react-native';

export class LockService {
  async lockAccount(userId: string, reason: string) {
    try {
      console.log(`계정 잠금 시작: ${userId}, 사유: ${reason}`);

      // 1. Firestore 계정 상태 변경
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          accountStatus: 'locked',
          lockedAt: firestore.Timestamp.now(),
          lockReason: reason,
        });

      // 2. 로컬 데이터 삭제
      await this.clearLocalData();

      // 3. 상태 업데이트 (잠금 화면으로 이동 트리거)
      useAuthStore.getState().setAccountLocked(true);

      // 4. 사용자 알림
      Alert.alert(
        '계정이 잠겼습니다',
        '45분 내에 체크하지 않아 모든 데이터가 삭제되었습니다. 앱을 재설치해야 합니다.',
        [{ text: '확인' }]
      );

      console.log('계정 잠금 완료');
    } catch (error) {
      console.error('계정 잠금 실패:', error);
      throw error;
    }
  }

  private async clearLocalData() {
    // AsyncStorage 전체 삭제
    await AsyncStorage.clear();
    console.log('로컬 저장소 삭제 완료');
  }

  async checkAccountStatus(userId: string): Promise<boolean> {
    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    const status = userDoc.data()?.accountStatus;
    return status === 'locked';
  }
}

export const lockService = new LockService();
```

### 4.3 잠금 화면 UI

```typescript
// src/screens/lock/AccountLockedScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import firestore from '@react-native-firebase/firestore';

export const AccountLockedScreen: React.FC = () => {
  const userId = useAuthStore(state => state.userId);
  const [lockInfo, setLockInfo] = React.useState<any>(null);

  useEffect(() => {
    loadLockInfo();
  }, []);

  const loadLockInfo = async () => {
    if (!userId) return;

    const userDoc = await firestore()
      .collection('users')
      .doc(userId)
      .get();

    const data = userDoc.data();
    const statsDoc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('current')
      .get();

    setLockInfo({
      lockedAt: data?.lockedAt?.toDate(),
      lockReason: data?.lockReason,
      lostStreak: statsDoc.data()?.longestStreak || 0,
      lostBadges: statsDoc.data()?.badges?.length || 0,
      lostCheckIns: statsDoc.data()?.totalCheckIns || 0,
    });
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>계정이 잠겼습니다</Text>

      {lockInfo && (
        <>
          <Text style={styles.date}>
            {lockInfo.lockedAt?.toLocaleString('ko-KR')}
          </Text>
          <Text style={styles.reason}>{lockInfo.lockReason}</Text>
        </>
      )}

      <View style={styles.lossSection}>
        <Text style={styles.lossTitle}>잃어버린 것들:</Text>
        <Text style={styles.lossItem}>
          🔥 {lockInfo?.lostStreak || 0}일 연속 기록
        </Text>
        <Text style={styles.lossItem}>
          🏆 모든 배지 ({lockInfo?.lostBadges || 0}개)
        </Text>
        <Text style={styles.lossItem}>
          📊 {lockInfo?.lostCheckIns || 0}일 통계 데이터
        </Text>
        <Text style={styles.warning}>
          ❌ 이 데이터는 복구할 수 없습니다
        </Text>
      </View>

      <View style={styles.instructionSection}>
        <Text style={styles.instructionTitle}>다시 시작하려면:</Text>
        <Text style={styles.instruction}>1️⃣ 이 앱을 삭제하세요</Text>
        <Text style={styles.instruction}>2️⃣ 앱스토어에서 재설치</Text>
        <Text style={styles.instruction}>3️⃣ 처음부터 설정하세요</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleOpenSettings}
      >
        <Text style={styles.buttonText}>앱 설정으로 이동</Text>
      </TouchableOpacity>

      <Text style={styles.finalWarning}>
        ⚠️ 이 작업은 되돌릴 수 없습니다
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 5,
  },
  reason: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 30,
  },
  lossSection: {
    width: '100%',
    padding: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    marginBottom: 20,
  },
  lossTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#C62828',
  },
  lossItem: {
    fontSize: 16,
    marginVertical: 5,
    color: '#212121',
  },
  warning: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 10,
    fontWeight: 'bold',
  },
  instructionSection: {
    width: '100%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 16,
    marginVertical: 5,
  },
  button: {
    width: '100%',
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  finalWarning: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
});
```

---

## 📊 기능 5: 통계 및 연속 기록

### 5.1 기능 개요
- 연속 기록 (Streak) 계산
- 배지 시스템 (7일, 30일, 100일, 365일)
- 월별 달성률 표시

### 5.2 통계 계산 로직

```typescript
// src/services/statsService.ts
import firestore from '@react-native-firebase/firestore';

export class StatsService {
  async updateStats(userId: string) {
    const statsRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('current');

    const checkInsRef = firestore()
      .collection('users')
      .doc(userId)
      .collection('checkIns')
      .orderBy('date', 'desc')
      .limit(365);

    const checkIns = await checkInsRef.get();

    // 연속 기록 계산
    const currentStreak = this.calculateStreak(checkIns.docs);

    // 최장 기록 업데이트
    const statsDoc = await statsRef.get();
    const currentStats = statsDoc.data() || {};
    const longestStreak = Math.max(
      currentStreak,
      currentStats.longestStreak || 0
    );

    // 총 체크인 횟수
    const totalCheckIns = checkIns.docs.filter(
      doc => doc.data().checkedAt !== null
    ).length;

    // 완벽한 주 계산
    const perfectWeeks = this.calculatePerfectWeeks(checkIns.docs);

    // 배지 계산
    const badges = this.calculateBadges(currentStreak, totalCheckIns);

    // 월별 통계
    const monthlyStats = this.calculateMonthlyStats(checkIns.docs);

    // Firestore 업데이트
    await statsRef.set({
      currentStreak,
      longestStreak,
      totalCheckIns,
      perfectWeeks,
      badges,
      monthlyStats,
      updatedAt: firestore.Timestamp.now(),
    });

    return {
      currentStreak,
      longestStreak,
      totalCheckIns,
      perfectWeeks,
      badges,
      monthlyStats,
    };
  }

  private calculateStreak(docs: any[]): number {
    if (docs.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < docs.length; i++) {
      const date = docs[i].id; // date는 'YYYY-MM-DD' 형식
      const expectedDate = this.subtractDays(today, i);

      if (date === expectedDate && docs[i].data().checkedAt) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculatePerfectWeeks(docs: any[]): number {
    // 월~금 5일 연속 체크한 주의 개수
    let perfectWeeks = 0;
    let weekDays = [];

    docs.forEach(doc => {
      const date = new Date(doc.id);
      const dayOfWeek = date.getDay(); // 0=일, 1=월, ..., 5=금

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekDays.push(doc.id);

        if (weekDays.length === 5) {
          // 5일 연속인지 확인
          const isConsecutive = this.isConsecutiveWeekdays(weekDays);
          if (isConsecutive) perfectWeeks++;
          weekDays = [];
        }
      }
    });

    return perfectWeeks;
  }

  private calculateBadges(streak: number, totalCheckIns: number): string[] {
    const badges: string[] = [];

    if (streak >= 7) badges.push('일주일_마스터');
    if (streak >= 30) badges.push('한달_챔피언');
    if (streak >= 100) badges.push('백일_전설');
    if (streak >= 365) badges.push('완벽주의자');

    if (totalCheckIns >= 50) badges.push('50일_달성');
    if (totalCheckIns >= 100) badges.push('100일_달성');
    if (totalCheckIns >= 200) badges.push('200일_달성');

    return badges;
  }

  private calculateMonthlyStats(docs: any[]): Record<string, any> {
    const monthlyStats: Record<string, any> = {};

    docs.forEach(doc => {
      const date = doc.id; // 'YYYY-MM-DD'
      const yearMonth = date.substring(0, 7); // 'YYYY-MM'

      if (!monthlyStats[yearMonth]) {
        monthlyStats[yearMonth] = {
          checkInDays: 0,
          totalDays: this.getDaysInMonth(yearMonth),
        };
      }

      if (doc.data().checkedAt) {
        monthlyStats[yearMonth].checkInDays++;
      }
    });

    // 달성률 계산
    Object.keys(monthlyStats).forEach(month => {
      const data = monthlyStats[month];
      data.achievementRate = Math.round(
        (data.checkInDays / data.totalDays) * 100
      );
    });

    return monthlyStats;
  }

  private subtractDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private isConsecutiveWeekdays(dates: string[]): boolean {
    // 월~금 5일이 연속인지 확인
    dates.sort();
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff !== 1) return false;
    }
    return true;
  }

  private getDaysInMonth(yearMonth: string): number {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }
}

export const statsService = new StatsService();
```

---

## ✅ 기능 완성도 체크리스트

### 위치 추적 ✓
- [x] Geofencing 구현
- [x] 백그라운드 추적
- [x] 진입/이탈 감지
- [x] 배터리 최적화
- [x] 권한 처리

### 카메라 검증 ✓
- [x] 후면 카메라 프리뷰
- [x] 사용자 수동 확인
- [x] iOS 정책 준수
- [x] 권한 처리

### 45분 타이머 ✓
- [x] 로컬 타이머
- [x] Cloud Functions 백업
- [x] 알림 스케줄링 (0, 5, 15, 30분)
- [x] 실시간 UI 업데이트

### 계정 잠금 ✓
- [x] 자동 잠금 로직
- [x] 데이터 삭제
- [x] 잠금 화면
- [x] 복구 불가 처리

### 통계 시스템 ✓
- [x] 연속 기록 계산
- [x] 배지 시스템
- [x] 월별 통계
- [x] 실시간 업데이트

---

**문서 작성 완료**
