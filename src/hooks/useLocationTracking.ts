import { useEffect, useState } from 'react';
import { useLocationStore } from '@stores/locationStore';
import { locationService } from '@services/locationService';
import { LocationPermission } from '@utils/constants';

/**
 * 위치 추적 커스텀 Hook
 */
export function useLocationTracking() {
  const [permission, setPermission] = useState<LocationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    isWithinCompany,
    isMonitoring,
    lastEntered,
    distanceToCompany,
  } = useLocationStore();

  useEffect(() => {
    // 권한 확인만 수행 (위치 추적은 startMonitoring에서 명시적으로)
    checkPermission();

    return () => {
      // Cleanup: 컴포넌트 언마운트 시 추적 중지하지 않음 (백그라운드 유지)
    };
  }, []);

  const checkPermission = async () => {
    try {
      const perm = await locationService.checkPermission();
      setPermission(perm);

      if (perm === LocationPermission.DENIED) {
        setError('위치 권한이 필요합니다');
      }
    } catch (err) {
      setError('권한 확인 실패');
      console.error(err);
    }
  };

  const requestPermission = async () => {
    try {
      const granted = await locationService.requestPermission();
      if (granted) {
        setPermission(LocationPermission.ALWAYS);
        setError(null);
        return true;
      } else {
        setPermission(LocationPermission.DENIED);
        setError('위치 권한이 거부되었습니다');
        return false;
      }
    } catch (err) {
      setError('권한 요청 실패');
      console.error(err);
      return false;
    }
  };

  const startMonitoring = async (userIdParam: string) => {
    if (!userIdParam) {
      setError('사용자 ID가 없습니다');
      console.error('❌ startMonitoring: userId가 null입니다');
      return false;
    }

    try {
      console.log(`✅ startMonitoring 시작: userId=${userIdParam}`);
      await locationService.startMonitoring(userIdParam);
      setError(null);
      return true;
    } catch (err: any) {
      setError(err.message || '위치 추적 시작 실패');
      console.error('❌ startMonitoring 실패:', err);
      return false;
    }
  };

  const stopMonitoring = () => {
    locationService.stopMonitoring();
  };

  const getCurrentDistance = async (): Promise<number | null> => {
    try {
      const distance = await locationService.getDistanceToCompany();
      return distance;
    } catch (err) {
      console.error('거리 조회 실패:', err);
      return null;
    }
  };

  return {
    // 상태
    isWithinCompany,
    isMonitoring,
    lastEntered,
    distanceToCompany,
    permission,
    error,

    // 액션
    requestPermission,
    startMonitoring,
    stopMonitoring,
    getCurrentDistance,
  };
}
