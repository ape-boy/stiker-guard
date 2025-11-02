import firestore from '@react-native-firebase/firestore';
import { useCheckInStore } from '@stores/checkInStore';
import { CheckInStatus } from '@utils/constants';
import { CreateCheckInDto, CheckInResult } from '@models/CheckIn';

/**
 * 체크인 서비스
 */
export class CheckInService {
  /**
   * 체크인 완료 처리
   */
  async completeCheckIn(
    userId: string,
    dto: CreateCheckInDto
  ): Promise<CheckInResult> {
    try {
      useCheckInStore.getState().setChecking(true);

      const { date, hasSticker, timestamp } = dto;

      // Firestore에 체크인 기록
      const checkInRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('checkIns')
        .doc(date);

      await checkInRef.set({
        date,
        checkedAt: firestore.Timestamp.fromDate(timestamp),
        hasSticker,
        enteredAt: firestore.Timestamp.now(),
      });

      // ✅ Bug #5 수정: 타이머 취소
      const { timerService } = await import('./timerService');
      await timerService.cancelTimer(userId);

      // ✅ Bug #6 수정: 통계 업데이트
      const { statsService } = await import('./statsService');
      const stats = await statsService.updateStats(userId);

      // 로컬 상태 업데이트
      useCheckInStore.getState().setStatus(CheckInStatus.CHECKED);
      useCheckInStore.getState().setLastCheckIn(timestamp);

      console.log('✅ 체크인 완료:', {
        date,
        hasSticker,
        time: timestamp.toLocaleString(),
        currentStreak: stats.currentStreak,
        newBadges: stats.newBadges,
      });

      // ✅ Bug #7 수정: 실제 통계 반환
      return {
        success: true,
        streak: stats.currentStreak,
        totalCheckIns: stats.totalCheckIns,
        newBadges: stats.newBadges,
      };
    } catch (error) {
      console.error('체크인 실패:', error);
      throw error;
    } finally {
      useCheckInStore.getState().setChecking(false);
    }
  }

  /**
   * 오늘 체크인 여부 확인
   */
  async getTodayCheckIn(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    const checkInDoc = await firestore()
      .collection('users')
      .doc(userId)
      .collection('checkIns')
      .doc(today)
      .get();

    if (checkInDoc.exists) {
      const data = checkInDoc.data();
      return data?.checkedAt !== null;
    }

    return false;
  }

  /**
   * 체크인 기록 조회 (최근 N일)
   */
  async getCheckInHistory(
    userId: string,
    limit: number = 30
  ): Promise<any[]> {
    const checkIns = await firestore()
      .collection('users')
      .doc(userId)
      .collection('checkIns')
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    return checkIns.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
  }
}

export const checkInService = new CheckInService();
