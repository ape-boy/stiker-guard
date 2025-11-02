/**
 * 알림 데이터 모델
 */
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  delay: number; // 밀리초
  importance: 'default' | 'high' | 'max';
}

/**
 * 예약된 알림
 */
export interface ScheduledNotification {
  id: string;
  triggerTime: number; // Unix timestamp (밀리초)
  notification: NotificationData;
}

/**
 * 알림 권한 상태
 */
export enum NotificationPermission {
  DENIED = 'denied',
  GRANTED = 'granted',
  NOT_DETERMINED = 'not_determined',
}
