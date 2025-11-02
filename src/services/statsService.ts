import firestore from '@react-native-firebase/firestore';
import { useCheckInStore } from '@stores/checkInStore';
import { BADGE_TIERS } from '@utils/constants';

/**
 * 통계 서비스
 */
export interface StatsData {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  perfectWeeks: number;
  badges: string[];
  monthlyStats: { [month: string]: { checkIns: number; achievementRate: number } };
}

export interface UpdateStatsResult {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  newBadges: string[];
}

export class StatsService {
  /**
   * 통계 업데이트 (체크인 완료 시 호출)
   */
  async updateStats(userId: string): Promise<UpdateStatsResult> {
    try {
      const statsRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('stats')
        .doc('current');

      // 1. 현재 통계 가져오기
      const statsDoc = await statsRef.get();
      const currentStats: StatsData = statsDoc.exists
        ? (statsDoc.data() as StatsData)
        : this.getInitialStats();

      // 2. Streak 계산
      const { currentStreak, longestStreak } = await this.calculateStreak(
        userId,
        currentStats.currentStreak,
        currentStats.longestStreak
      );

      // 3. 총 체크인 수 증가
      const totalCheckIns = currentStats.totalCheckIns + 1;

      // 4. Perfect weeks 계산
      const perfectWeeks = await this.calculatePerfectWeeks(userId);

      // 5. 배지 획득 확인
      const newBadges = this.checkNewBadges(currentStreak, currentStats.badges);
      const badges = [...new Set([...currentStats.badges, ...newBadges])];

      // 6. 월별 통계 업데이트
      const monthlyStats = await this.updateMonthlyStats(
        userId,
        currentStats.monthlyStats
      );

      // 7. Firestore 업데이트
      const updatedStats: StatsData = {
        currentStreak,
        longestStreak,
        totalCheckIns,
        perfectWeeks,
        badges,
        monthlyStats,
      };

      await statsRef.set(updatedStats, { merge: true });

      // 8. 로컬 상태 업데이트
      useCheckInStore.getState().setCurrentStreak(currentStreak);

      console.log('✅ 통계 업데이트 완료:', {
        currentStreak,
        longestStreak,
        totalCheckIns,
        newBadges,
      });

      return {
        currentStreak,
        longestStreak,
        totalCheckIns,
        newBadges,
      };
    } catch (error) {
      console.error('❌ 통계 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * Streak 계산 로직
   */
  private async calculateStreak(
    userId: string,
    prevStreak: number,
    prevLongest: number
  ): Promise<{ currentStreak: number; longestStreak: number }> {
    try {
      // 어제 날짜 계산
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      // 어제 체크인 여부 확인
      const yesterdayDoc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('checkIns')
        .doc(yesterdayStr)
        .get();

      let currentStreak: number;
      if (yesterdayDoc.exists) {
        // 어제 체크했으면 연속 +1
        currentStreak = prevStreak + 1;
      } else {
        // 어제 체크 안했으면 1부터 다시 시작
        currentStreak = 1;
      }

      const longestStreak = Math.max(prevLongest, currentStreak);

      return { currentStreak, longestStreak };
    } catch (error) {
      console.error('Streak 계산 실패:', error);
      return { currentStreak: 1, longestStreak: prevLongest };
    }
  }

  /**
   * Perfect weeks 계산 (7일 연속 체크)
   */
  private async calculatePerfectWeeks(userId: string): Promise<number> {
    try {
      // 전체 체크인 기록 가져오기
      const checkInsSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('checkIns')
        .orderBy('date', 'asc')
        .get();

      const checkInDates = checkInsSnapshot.docs.map((doc) => doc.id); // 'YYYY-MM-DD' 형식

      // 연속 7일 구간 찾기
      let perfectWeeks = 0;
      let consecutiveDays = 1;
      let prevDate: Date | null = null;

      for (const dateStr of checkInDates) {
        const currentDate = new Date(dateStr);

        if (prevDate) {
          const diffDays = Math.floor(
            (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            // 연속
            consecutiveDays++;

            // 7일 달성
            if (consecutiveDays === 7) {
              perfectWeeks++;
              consecutiveDays = 0; // 리셋하여 다음 구간 찾기
            }
          } else {
            // 연속 끊김
            consecutiveDays = 1;
          }
        }

        prevDate = currentDate;
      }

      return perfectWeeks;
    } catch (error) {
      console.error('Perfect weeks 계산 실패:', error);
      return 0;
    }
  }

  /**
   * 새 배지 획득 확인
   */
  private checkNewBadges(currentStreak: number, existingBadges: string[]): string[] {
    const newBadges: string[] = [];

    // 배지 티어 체크
    const badgeTiers = [
      { streak: 7, name: BADGE_TIERS.WEEK_1.name },
      { streak: 14, name: BADGE_TIERS.WEEK_2.name },
      { streak: 21, name: BADGE_TIERS.WEEK_3.name },
      { streak: 30, name: BADGE_TIERS.MONTH_1.name },
      { streak: 60, name: BADGE_TIERS.MONTH_2.name },
      { streak: 90, name: BADGE_TIERS.MONTH_3.name },
      { streak: 180, name: BADGE_TIERS.HALF_YEAR.name },
      { streak: 365, name: BADGE_TIERS.YEAR.name },
    ];

    for (const tier of badgeTiers) {
      if (currentStreak >= tier.streak && !existingBadges.includes(tier.name)) {
        newBadges.push(tier.name);
      }
    }

    return newBadges;
  }

  /**
   * 월별 통계 업데이트
   */
  private async updateMonthlyStats(
    userId: string,
    prevMonthlyStats: { [month: string]: { checkIns: number; achievementRate: number } }
  ): Promise<{ [month: string]: { checkIns: number; achievementRate: number } }> {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // 'YYYY-MM'

      // 이번 달 체크인 수 계산 (타임존 안전 처리)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEndStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;

      const monthCheckIns = await firestore()
        .collection('users')
        .doc(userId)
        .collection('checkIns')
        .orderBy('date', 'asc')
        .where('date', '>=', monthStartStr)
        .where('date', '<=', monthEndStr)
        .get();

      const checkInCount = monthCheckIns.size;
      const daysInMonth = monthEnd.getDate();
      const achievementRate = Math.round((checkInCount / daysInMonth) * 100);

      // 월별 통계 업데이트
      const updatedMonthlyStats = { ...prevMonthlyStats };
      updatedMonthlyStats[currentMonth] = {
        checkIns: checkInCount,
        achievementRate,
      };

      return updatedMonthlyStats;
    } catch (error) {
      console.error('월별 통계 업데이트 실패:', error);
      return prevMonthlyStats;
    }
  }

  /**
   * 통계 조회
   */
  async getStats(userId: string): Promise<StatsData> {
    try {
      const statsDoc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('stats')
        .doc('current')
        .get();

      if (statsDoc.exists) {
        return statsDoc.data() as StatsData;
      }

      return this.getInitialStats();
    } catch (error) {
      console.error('통계 조회 실패:', error);
      return this.getInitialStats();
    }
  }

  /**
   * 초기 통계 데이터
   */
  private getInitialStats(): StatsData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      perfectWeeks: 0,
      badges: [],
      monthlyStats: {},
    };
  }
}

export const statsService = new StatsService();
