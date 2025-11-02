/**
 * 스티커 가드 앱 - 상수 정의
 */

// 회사 위치 (경기도 수원시 인근)
export const COMPANY_LOCATION = {
  latitude: 37.2253811,
  longitude: 127.0706423,
  radius: 300, // 미터
} as const;

// 타이머 설정 (밀리초)
export const TIMER_CONFIG = {
  DEADLINE_MINUTES: 45,
  DEADLINE_MS: 45 * 60 * 1000,
  NOTIFICATION_INTERVALS: [0, 5, 15, 30], // 분 단위
} as const;

// 알림 메시지
export const NOTIFICATION_MESSAGES = {
  IMMEDIATE: {
    title: '💚 입문 전 스티커 체크 필수!',
    body: '45분 내에 체크하지 않으면 계정이 잠깁니다',
  },
  AFTER_5MIN: {
    title: '⚠️ 아직 체크 안 하셨어요',
    body: '40분 남았습니다. 지금 바로 체크하세요!',
  },
  AFTER_15MIN: {
    title: '⚠️ 체크 시간 안내',
    body: '30분 남았습니다. 체크하지 않으면 모든 데이터가 삭제됩니다.',
  },
  AFTER_30MIN: {
    title: '🚨 마지막 경고!',
    body: '15분만 남았습니다! 지금 체크하지 않으면 계정이 잠깁니다!',
  },
} as const;

// 배지 조건
export const BADGE_CONDITIONS = {
  WEEK_MASTER: { streak: 7, name: '일주일_마스터', icon: '🏅' },
  MONTH_CHAMPION: { streak: 30, name: '한달_챔피언', icon: '🏆' },
  HUNDRED_DAYS: { streak: 100, name: '백일_전설', icon: '💯' },
  PERFECTIONIST: { streak: 365, name: '완벽주의자', icon: '👑' },
  FIFTY_DAYS: { totalCheckIns: 50, name: '50일_달성', icon: '⭐' },
  HUNDRED_CHECKINS: { totalCheckIns: 100, name: '100일_달성', icon: '🌟' },
  TWO_HUNDRED_CHECKINS: { totalCheckIns: 200, name: '200일_달성', icon: '✨' },
} as const;

// 배지 티어 (statsService와 호환성 유지)
export const BADGE_TIERS = {
  WEEK_1: {
    name: '일주일_마스터',
    icon: '🏅',
    description: '7일 연속 체크',
    requiredStreak: 7
  },
  WEEK_2: {
    name: '2주_연속',
    icon: '🥈',
    description: '14일 연속 체크',
    requiredStreak: 14
  },
  WEEK_3: {
    name: '3주_연속',
    icon: '🥇',
    description: '21일 연속 체크',
    requiredStreak: 21
  },
  MONTH_1: {
    name: '한달_챔피언',
    icon: '🏆',
    description: '30일 연속 체크',
    requiredStreak: 30
  },
  MONTH_2: {
    name: '2개월_연속',
    icon: '💎',
    description: '60일 연속 체크',
    requiredStreak: 60
  },
  MONTH_3: {
    name: '3개월_연속',
    icon: '💍',
    description: '90일 연속 체크',
    requiredStreak: 90
  },
  HALF_YEAR: {
    name: '반년_연속',
    icon: '⭐',
    description: '180일 연속 체크',
    requiredStreak: 180
  },
  YEAR: {
    name: '완벽주의자',
    icon: '👑',
    description: '365일 연속 체크',
    requiredStreak: 365
  },
} as const;

// 컬러 팔레트
export const COLORS = {
  PRIMARY: '#4CAF50',
  SECONDARY: '#2196F3',
  WARNING: '#FF9800',
  DANGER: '#F44336',
  ERROR: '#F44336',
  SUCCESS: '#4CAF50',
  INFO: '#2196F3',
  GRAY: '#9E9E9E',
  BACKGROUND: '#FFFFFF',
  TEXT: '#212121',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  BORDER: '#E0E0E0',
} as const;

// 폰트 크기
export const FONT_SIZES = {
  H1: 32,
  H2: 24,
  H3: 20,
  BODY: 16,
  CAPTION: 14,
  BUTTON: 18,
} as const;

// 스토리지 키
export const STORAGE_KEYS = {
  USER_ID: 'user_id',
  COMPANY_LOCATION: 'company_location',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LAST_CHECK_DATE: 'last_check_date',
} as const;

// API 엔드포인트 (Cloud Functions)
export const API_ENDPOINTS = {
  CHECK_TIMER_EXPIRATION: 'checkTimerExpiration',
  DELETE_USER_DATA: 'deleteUserData',
  UPDATE_STATS: 'onCheckInComplete',
} as const;

// 날짜 형식
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  YEAR_MONTH: 'YYYY-MM',
  DISPLAY_DATE: 'YYYY년 MM월 DD일',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

// 계정 상태
export enum AccountStatus {
  ACTIVE = 'active',
  LOCKED = 'locked',
}

// 체크인 상태
export enum CheckInStatus {
  NOT_CHECKED = 'not_checked',
  CHECKED = 'checked',
  EXPIRED = 'expired',
}

// 위치 권한 상태
export enum LocationPermission {
  DENIED = 'denied',
  WHEN_IN_USE = 'when_in_use',
  ALWAYS = 'always',
}

// 카메라 권한 상태
export enum CameraPermission {
  DENIED = 'denied',
  GRANTED = 'granted',
}
