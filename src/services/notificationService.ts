import notifee, {
  TriggerType,
  AndroidImportance,
  TimestampTrigger,
  IOSForegroundPresentationOptions,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { NOTIFICATION_MESSAGES, TIMER_CONFIG } from '@utils/constants';

/**
 * 알림 서비스
 */
export class NotificationService {
  private channelId = 'checkin-reminders';

  /**
   * 알림 권한 요청
   */
  async requestPermission(): Promise<boolean> {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = authorized
  }

  /**
   * 알림 채널 생성 (Android)
   */
  async createChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: this.channelId,
        name: '체크인 알림',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
      });
    }
  }

  /**
   * 45분 타이머에 대한 모든 알림 스케줄링
   */
  async scheduleAllNotifications(deadline: Date): Promise<void> {
    await this.createChannel();

    // ⚡ MEDIUM #5 수정 (1): 기존 알림 취소하여 중복 스케줄링 방지
    await this.cancelAllNotifications();

    const now = Date.now();
    const intervals = TIMER_CONFIG.NOTIFICATION_INTERVALS; // [0, 5, 15, 30] 분

    const notifications = [
      {
        id: 'notify-0min',
        delay: intervals[0],
        ...NOTIFICATION_MESSAGES.IMMEDIATE,
        importance: AndroidImportance.DEFAULT,
      },
      {
        id: 'notify-5min',
        delay: intervals[1],
        ...NOTIFICATION_MESSAGES.AFTER_5MIN,
        importance: AndroidImportance.HIGH,
      },
      {
        id: 'notify-15min',
        delay: intervals[2],
        ...NOTIFICATION_MESSAGES.AFTER_15MIN,
        importance: AndroidImportance.HIGH,
      },
      {
        id: 'notify-30min',
        delay: intervals[3],
        ...NOTIFICATION_MESSAGES.AFTER_30MIN,
        importance: AndroidImportance.HIGH,
      },
    ];

    for (const notif of notifications) {
      const triggerTime = now + notif.delay * 60 * 1000;

      // ⚡ MEDIUM #5 수정 (2): 0분 알림은 즉시 표시
      if (notif.delay === 0) {
        await this.displayNotification(notif.title, notif.body);
        console.log(`알림 즉시 표시: ${notif.id}`);
        continue;
      }

      // 이미 지난 시간이면 스킵 (수정: 조건 역전)
      if (triggerTime < now || triggerTime > deadline.getTime()) continue;

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
            channelId: this.channelId,
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
            foregroundPresentationOptions: {
              alert: true,
              badge: true,
              sound: true,
            } as IOSForegroundPresentationOptions,
          },
        },
        trigger
      );

      console.log(`알림 스케줄: ${notif.id} at ${new Date(triggerTime).toLocaleTimeString()}`);
    }
  }

  /**
   * 모든 알림 취소
   */
  async cancelAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
    console.log('모든 알림 취소됨');
  }

  /**
   * 특정 알림 취소
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await notifee.cancelNotification(notificationId);
  }

  /**
   * 즉시 알림 표시 (로컬 알림)
   */
  async displayNotification(
    title: string,
    body: string
  ): Promise<void> {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: this.channelId,
        importance: AndroidImportance.HIGH,
      },
      ios: {
        sound: 'default',
      },
    });
  }
}

export const notificationService = new NotificationService();
