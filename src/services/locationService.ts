import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useLocationStore } from '@stores/locationStore';
import { COMPANY_LOCATION, LocationPermission } from '@utils/constants';
import {
  calculateDistance,
  isWithinCompanyRadius,
  Coordinate,
} from '@utils/locationUtils';

/**
 * 위치 추적 서비스
 */
export class LocationService {
  private watchId: number | null = null;
  private isTracking = false;
  private wasWithinRadius = false;

  /**
   * 위치 권한 확인 (읽기 전용)
   */
  async checkPermission(): Promise<LocationPermission> {
    if (Platform.OS === 'ios') {
      // iOS: 권한 상태 확인 (requestAuthorization은 이미 허용된 경우 팝업 표시 안 함)
      const auth = await Geolocation.requestAuthorization('always');
      if (auth === 'granted') return LocationPermission.ALWAYS;
      if (auth === 'disabled' || auth === 'restricted') return LocationPermission.DENIED;
      return LocationPermission.WHEN_IN_USE;
    }

    // Android: 백그라운드 권한도 확인
    const fineGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    // Android 10+ (API 29+)에서는 백그라운드 위치 권한도 필요
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
    if (apiLevel >= 29) {
      const backgroundGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
      );
      if (fineGranted && backgroundGranted) return LocationPermission.ALWAYS;
      if (fineGranted) return LocationPermission.WHEN_IN_USE;
      return LocationPermission.DENIED;
    }

    return fineGranted ? LocationPermission.ALWAYS : LocationPermission.DENIED;
  }

  /**
   * 위치 권한 요청 (⚡ HIGH #4 수정: iOS는 팝업 1회만, Android는 백그라운드 권한 추가)
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // iOS: 'always' 권한 요청
      const auth = await Geolocation.requestAuthorization('always');
      return auth === 'granted';
    }

    // Android: 먼저 일반 위치 권한 요청
    const fineGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: '위치 권한 필요',
        message: '회사 도착 시 자동 알림을 위해 위치 권한이 필요합니다.',
        buttonNeutral: '나중에',
        buttonNegative: '거부',
        buttonPositive: '허용',
      }
    );

    if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }

    // Android 10+ (API 29+): 백그라운드 위치 권한 추가 요청
    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
    if (apiLevel >= 29) {
      const backgroundGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: '백그라운드 위치 권한 필요',
          message: '백그라운드에서도 위치 추적을 위해 "항상 허용"을 선택해주세요.',
          buttonNeutral: '나중에',
          buttonNegative: '거부',
          buttonPositive: '항상 허용',
        }
      );
      return backgroundGranted === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  }

  /**
   * 위치 추적 시작
   */
  async startMonitoring(userId: string): Promise<void> {
    if (this.isTracking) {
      console.log('이미 위치 추적 중');
      return;
    }

    // 권한 확인
    const permission = await this.checkPermission();
    if (permission === LocationPermission.DENIED) {
      throw new Error('위치 권한이 필요합니다');
    }

    console.log('위치 추적 시작');

    // 실시간 위치 업데이트 감시
    this.watchId = Geolocation.watchPosition(
      async (position) => {
        await this.handleLocationUpdate(userId, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('위치 업데이트 오류:', error);
      },
      {
        enableHighAccuracy: false, // 배터리 절약
        distanceFilter: 50, // 50m 이동 시에만 업데이트
        interval: 900000, // 15분 간격
        fastestInterval: 300000, // 최소 5분 간격
        forceRequestLocation: true,
        showLocationDialog: true,
      }
    );

    this.isTracking = true;
    useLocationStore.getState().setMonitoring(true);
  }

  /**
   * 위치 업데이트 처리
   */
  private async handleLocationUpdate(
    userId: string,
    currentLocation: Coordinate
  ): Promise<void> {
    console.log('위치 업데이트:', currentLocation);

    // 회사 반경 체크
    const isWithin = isWithinCompanyRadius(currentLocation);

    // 거리 계산
    const distance = calculateDistance(
      {
        latitude: COMPANY_LOCATION.latitude,
        longitude: COMPANY_LOCATION.longitude,
      },
      currentLocation
    );

    console.log(`회사까지 거리: ${Math.round(distance)}m`);

    // 상태 업데이트
    useLocationStore.getState().setDistance(distance);
    useLocationStore.getState().setEntered(isWithin);

    // 진입 이벤트 감지 (이전에 밖에 있었다가 안으로 들어옴)
    if (isWithin && !this.wasWithinRadius) {
      console.log('✅ 회사 반경 진입 감지!');
      await this.onCompanyEnter(userId);
    }

    // 이탈 이벤트 감지
    if (!isWithin && this.wasWithinRadius) {
      console.log('❌ 회사 반경 이탈');
      await this.onCompanyExit(userId);
    }

    this.wasWithinRadius = isWithin;
  }

  /**
   * 회사 진입 이벤트 핸들러
   */
  private async onCompanyEnter(userId: string): Promise<void> {
    try {
      // ✅ Bug #2 수정: 오늘 이미 체크했는지 확인
      const { checkInService } = await import('./checkInService');
      const hasCheckedToday = await checkInService.getTodayCheckIn(userId);

      if (hasCheckedToday) {
        console.log('✅ 오늘 이미 체크 완료 - 타이머 시작 안함');
        return; // Early return - 기획안 요구사항: "당일 미체크 상태일 경우에만 알림"
      }

      const now = firestore.Timestamp.now();
      const enteredAt = now.toDate();
      const deadline = new Date(enteredAt.getTime() + 45 * 60 * 1000); // 45분 후

      // Firestore 업데이트
      await firestore().collection('users').doc(userId).update({
        lastEnteredCompany: now,
        checkInDeadline: firestore.Timestamp.fromDate(deadline),
      });

      // 로컬 상태 업데이트
      useLocationStore.getState().setLastEntered(enteredAt);

      console.log(`회사 진입 기록: ${enteredAt.toLocaleString()}`);
      console.log(`체크인 마감: ${deadline.toLocaleString()}`);

      // ✅ Bug #1 수정: 타이머 시작
      const { timerService } = await import('./timerService');
      await timerService.startTimer(userId, deadline);
    } catch (error) {
      console.error('회사 진입 처리 오류:', error);
      throw error;
    }
  }

  /**
   * 회사 이탈 이벤트 핸들러
   */
  private async onCompanyExit(userId: string): Promise<void> {
    console.log('회사 이탈 기록');

    // ⚡ MEDIUM #7 수정: 타이머 중지 (300m 밖에서는 체크 불가)
    try {
      const { timerService } = await import('./timerService');
      const { useTimerStore } = await import('@stores/timerStore');

      // 진행 중인 타이머가 있으면 취소
      if (useTimerStore.getState().isActive) {
        await timerService.cancelTimer(userId);
        console.log('✅ 회사 이탈로 타이머 취소됨');
      }
    } catch (error) {
      console.error('회사 이탈 처리 오류:', error);
    }
  }

  /**
   * 현재 위치 조회 (1회성)
   */
  async getCurrentLocation(): Promise<Coordinate> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * 회사까지의 거리 조회
   */
  async getDistanceToCompany(): Promise<number> {
    const currentLocation = await this.getCurrentLocation();
    return calculateDistance(
      {
        latitude: COMPANY_LOCATION.latitude,
        longitude: COMPANY_LOCATION.longitude,
      },
      currentLocation
    );
  }

  /**
   * 위치 추적 중지
   */
  stopMonitoring(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.wasWithinRadius = false;
    useLocationStore.getState().setMonitoring(false);
    console.log('위치 추적 중지');
  }

  /**
   * 추적 상태 확인
   */
  isMonitoring(): boolean {
    return this.isTracking;
  }
}

export const locationService = new LocationService();
