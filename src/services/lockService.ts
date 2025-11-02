import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@stores/authStore';
import { useLocationStore } from '@stores/locationStore';
import { useCheckInStore } from '@stores/checkInStore';
import { useTimerStore } from '@stores/timerStore';
import { Alert } from 'react-native';
import { AccountStatus } from '@utils/constants';

/**
 * 계정 잠금 서비스
 */
export class LockService {
  /**
   * 계정 잠금 실행
   */
  async lockAccount(userId: string, reason: string): Promise<void> {
    try {
      console.log(`🔒 계정 잠금 시작: ${userId}`);
      console.log(`🔒 잠금 사유: ${reason}`);

      // 1. Firestore 계정 상태 변경
      await firestore().collection('users').doc(userId).update({
        accountStatus: AccountStatus.LOCKED,
        lockedAt: firestore.Timestamp.now(),
        lockReason: reason,
      });

      // 2. 데이터 삭제 트리거 (Cloud Functions에서도 처리하지만 로컬에서도 실행)
      await this.deleteUserData(userId);

      // 3. 로컬 저장소 삭제
      await this.clearLocalStorage();

      // 4. 로컬 상태 업데이트
      useAuthStore.getState().setAccountLocked(true, reason);

      // 5. 사용자 알림
      this.showLockAlert();

      console.log('✅ 계정 잠금 완료');
    } catch (error) {
      console.error('❌ 계정 잠금 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자 데이터 삭제 (⚡ HIGH #5 수정: Firestore batch 500건 제한 대응)
   */
  private async deleteUserData(userId: string): Promise<void> {
    try {
      // checkIns 서브컬렉션 삭제 (페이지네이션)
      const batchSize = 500;
      const checkInsRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('checkIns');

      let deleted = 0;
      let hasMore = true;

      while (hasMore) {
        const snapshot = await checkInsRef.limit(batchSize).get();

        if (snapshot.empty) {
          hasMore = false;
          break;
        }

        const batch = firestore().batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          deleted++;
        });

        await batch.commit();
        console.log(`✅ ${deleted}개 체크인 기록 삭제 중...`);

        // 500개 미만이면 마지막 배치
        if (snapshot.size < batchSize) {
          hasMore = false;
        }
      }

      // stats 초기화 (별도 batch)
      const statsRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('stats')
        .doc('current');

      await statsRef.set({
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        perfectWeeks: 0,
        badges: [],
        monthlyStats: {},
        deletedAt: firestore.Timestamp.now(),
      });

      console.log(`✅ 사용자 데이터 삭제 완료 (총 ${deleted}개)`);
    } catch (error) {
      console.error('❌ 데이터 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 로컬 저장소 클리어
   */
  private async clearLocalStorage(): Promise<void> {
    try {
      // AsyncStorage 전체 삭제
      await AsyncStorage.clear();

      // 모든 Store 초기화
      useAuthStore.getState().reset();
      useLocationStore.getState().reset();
      useCheckInStore.getState().reset();
      useTimerStore.getState().reset();

      console.log('✅ 로컬 저장소 삭제 완료');
    } catch (error) {
      console.error('❌ 로컬 저장소 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 잠금 알림 표시
   */
  private showLockAlert(): void {
    Alert.alert(
      '🔒 계정이 잠겼습니다',
      '45분 내에 체크하지 않아 모든 데이터가 삭제되었습니다. 앱을 재설치해야 합니다.',
      [
        {
          text: '확인',
          onPress: () => console.log('잠금 알림 확인'),
        },
      ],
      { cancelable: false }
    );
  }

  /**
   * 계정 상태 확인
   */
  async checkAccountStatus(userId: string): Promise<boolean> {
    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return false;
      }

      const status = userDoc.data()?.accountStatus;
      const isLocked = status === AccountStatus.LOCKED;

      if (isLocked) {
        const lockReason = userDoc.data()?.lockReason;
        useAuthStore.getState().setAccountLocked(true, lockReason);
      }

      return isLocked;
    } catch (error) {
      console.error('계정 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 잠금 정보 조회
   */
  async getLockInfo(userId: string): Promise<{
    lockedAt: Date | null;
    lockReason: string | null;
    lostStreak: number;
    lostBadges: number;
    lostCheckIns: number;
  }> {
    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      const statsDoc = await firestore()
        .collection('users')
        .doc(userId)
        .collection('stats')
        .doc('current')
        .get();

      const userData = userDoc.data();
      const statsData = statsDoc.data();

      return {
        lockedAt: userData?.lockedAt?.toDate() || null,
        lockReason: userData?.lockReason || null,
        lostStreak: statsData?.longestStreak || 0,
        lostBadges: statsData?.badges?.length || 0,
        lostCheckIns: statsData?.totalCheckIns || 0,
      };
    } catch (error) {
      console.error('잠금 정보 조회 실패:', error);
      return {
        lockedAt: null,
        lockReason: null,
        lostStreak: 0,
        lostBadges: 0,
        lostCheckIns: 0,
      };
    }
  }
}

export const lockService = new LockService();
