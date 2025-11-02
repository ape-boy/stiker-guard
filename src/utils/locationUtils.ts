import { COMPANY_LOCATION } from './constants';

/**
 * 위도/경도 좌표
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Haversine 공식을 사용한 두 지점 간 거리 계산 (미터 단위)
 *
 * @param point1 첫 번째 좌표
 * @param point2 두 번째 좌표
 * @returns 거리 (미터)
 */
export function calculateDistance(
  point1: Coordinate,
  point2: Coordinate
): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위 거리
}

/**
 * 회사 반경 내에 있는지 확인
 *
 * @param currentLocation 현재 위치
 * @returns true if within company radius
 */
export function isWithinCompanyRadius(currentLocation: Coordinate): boolean {
  const distance = calculateDistance(
    {
      latitude: COMPANY_LOCATION.latitude,
      longitude: COMPANY_LOCATION.longitude,
    },
    currentLocation
  );

  return distance <= COMPANY_LOCATION.radius;
}

/**
 * 회사까지의 거리 계산
 *
 * @param currentLocation 현재 위치
 * @returns 거리 (미터)
 */
export function getDistanceToCompany(currentLocation: Coordinate): number {
  return calculateDistance(
    {
      latitude: COMPANY_LOCATION.latitude,
      longitude: COMPANY_LOCATION.longitude,
    },
    currentLocation
  );
}

/**
 * 거리 포맷팅 (사용자 친화적 텍스트)
 *
 * @param distance 거리 (미터)
 * @returns 포맷된 문자열 (예: "250m", "1.2km")
 */
export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
}

/**
 * 위치 권한 상태 텍스트
 */
export const LocationPermissionText = {
  denied: '위치 권한이 거부되었습니다',
  when_in_use: '앱 사용 중에만 위치 사용 가능',
  always: '항상 위치 사용 허용됨',
};
