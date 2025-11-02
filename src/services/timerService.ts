import firestore from '@react-native-firebase/firestore';
import { useTimerStore } from '@stores/timerStore';
import { notificationService } from './notificationService';
import { TIMER_CONFIG } from '@utils/constants';

/**
 * 45분 타이머 서비스
 */
export class TimerService {
  private timerId: NodeJS.Timeout | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * 타이머 시작
   */
  async startTimer(userId: string, deadline: Date): Promise<void> {
    console.log('45분 타이머 시작:', deadline.toLocaleString());

    // 기존 타이머 취소 (중복 실행 방지)
    this.clearTimerId();
    this.stopCountdown(); // ⚡ HIGH #3 수정: interval도 정리

    // Zustand 상태 업데이트
    useTimerStore.getState().startTimer(deadline);

    // Firestore에 마감 시간 저장
    await firestore().collection('users').doc(userId).update({
      checkInDeadline: firestore.Timestamp.fromDate(deadline),
    });

    // 알림 스케줄링
    await notificationService.scheduleAllNotifications(deadline);

    // 45분 후 타임아웃 타이머 설정
    const delay = deadline.getTime() - Date.now();
    this.timerId = setTimeout(async () => {
      console.log('⏰ 45분 타이머 만료!');
      await this.onTimerExpired(userId);
    }, delay);

    // 1초마다 남은 시간 업데이트
    this.startCountdown(deadline);
  }

  /**
   * 카운트다운 업데이트 (UI용)
   */
  private startCountdown(deadline: Date): void {
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((deadline.getTime() - now) / 1000));

      useTimerStore.getState().updateRemaining(remaining);

      // 타이머 만료 시 interval 중지
      if (remaining === 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  /**
   * 카운트다운 중지
   */
  private stopCountdown(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 타이머 만료 시 처리
   */
  private async onTimerExpired(userId: string): Promise<void> {
    console.log('⏰ 타이머 만료 - 계정 잠금 처리 시작');

    try {
      // 계정 잠금 서비스 호출
      const { lockService } = await import('./lockService');
      await lockService.lockAccount(userId, '45분 내 체크 미완료');
    } catch (error) {
      console.error('계정 잠금 처리 실패:', error);
    }

    // 상태 초기화
    this.stopCountdown();
    useTimerStore.getState().stopTimer();
  }

  /**
   * 타이머 취소 (체크인 완료 시)
   */
  async cancelTimer(userId?: string): Promise<void> {
    console.log('타이머 취소');

    // 로컬 타이머 취소
    this.clearTimerId();
    this.stopCountdown();

    // 모든 알림 취소
    await notificationService.cancelAllNotifications();

    // 상태 초기화
    useTimerStore.getState().stopTimer();

    // Firestore 업데이트 (userId가 있을 경우)
    if (userId) {
      await firestore().collection('users').doc(userId).update({
        checkInDeadline: null,
      });
    }
  }

  /**
   * 내부 타이머 취소 (중복 실행 방지)
   */
  private clearTimerId(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 남은 시간 계산 (초 단위)
   */
  getRemainingTime(deadline: Date): number {
    const now = Date.now();
    const remaining = deadline.getTime() - now;
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * 남은 시간 포맷 (MM:SS)
   */
  formatRemainingTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 진행률 계산 (0-1)
   */
  getProgress(deadline: Date): number {
    const total = TIMER_CONFIG.DEADLINE_MS;
    const remaining = this.getRemainingTime(deadline) * 1000;
    return Math.max(0, Math.min(1, 1 - remaining / total));
  }
}

export const timerService = new TimerService();
