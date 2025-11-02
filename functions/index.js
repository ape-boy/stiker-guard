const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * 1분마다 실행: 체크인 마감 시간 초과된 계정 잠금
 *
 * 동작:
 * - checkInDeadline이 현재 시간보다 이전인 사용자 조회
 * - accountStatus가 'active'인 사용자만
 * - 자동으로 계정 잠금 및 데이터 삭제
 */
exports.checkTimerExpiration = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    console.log('⏰ 타이머 만료 체크 시작');

    try {
      const now = admin.firestore.Timestamp.now();

      // 마감 시간 초과된 계정 조회
      const expiredUsers = await admin
        .firestore()
        .collection('users')
        .where('accountStatus', '==', 'active')
        .where('checkInDeadline', '<', now)
        .get();

      if (expiredUsers.empty) {
        console.log('⏰ 만료된 타이머 없음');
        return null;
      }

      console.log(`⚠️ 만료된 계정 ${expiredUsers.size}개 발견`);

      // 각 계정 잠금 처리
      const batch = admin.firestore().batch();
      const lockPromises = [];

      for (const userDoc of expiredUsers.docs) {
        const userId = userDoc.id;
        console.log(`🔒 계정 잠금 처리: ${userId}`);

        // 1. 계정 상태 변경
        batch.update(userDoc.ref, {
          accountStatus: 'locked',
          lockedAt: now,
          lockReason: '45분 내 체크 미완료 (서버)',
          checkInDeadline: null,
        });

        // 2. 데이터 삭제 (별도 처리)
        lockPromises.push(deleteUserData(userId));
      }

      await batch.commit();
      await Promise.all(lockPromises);

      console.log(`✅ ${expiredUsers.size}개 계정 잠금 완료`);
      return null;
    } catch (error) {
      console.error('❌ 타이머 만료 체크 실패:', error);
      throw error;
    }
  });

/**
 * 체크인 완료 시 자동 실행: 통계 업데이트
 *
 * 트리거: users/{userId}/checkIns/{checkInId} 생성 시
 * 동작: Streak, 배지, 월별 통계 자동 계산
 */
exports.onCheckInComplete = functions.firestore
  .document('users/{userId}/checkIns/{checkInId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    const checkInData = snap.data();

    console.log(`✅ 체크인 완료 트리거: ${userId}`);

    try {
      // Stats 계산
      const stats = await calculateStats(userId);

      // Stats 문서 업데이트
      await admin
        .firestore()
        .collection('users')
        .doc(userId)
        .collection('stats')
        .doc('current')
        .set(stats, { merge: true });

      console.log(`📊 통계 업데이트 완료: ${userId}`, {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalCheckIns: stats.totalCheckIns,
      });

      return null;
    } catch (error) {
      console.error('❌ 통계 업데이트 실패:', error);
      throw error;
    }
  });

/**
 * 사용자 데이터 삭제 (헬퍼 함수)
 */
async function deleteUserData(userId) {
  try {
    const batch = admin.firestore().batch();

    // checkIns 서브컬렉션 삭제
    const checkInsSnapshot = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('checkIns')
      .get();

    checkInsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // stats 초기화
    const statsRef = admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('current');

    batch.set(statsRef, {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      perfectWeeks: 0,
      badges: [],
      monthlyStats: {},
      deletedAt: admin.firestore.Timestamp.now(),
    });

    await batch.commit();
    console.log(`🗑️ 데이터 삭제 완료: ${userId}`);
  } catch (error) {
    console.error(`❌ 데이터 삭제 실패: ${userId}`, error);
    throw error;
  }
}

/**
 * 통계 계산 (헬퍼 함수)
 */
async function calculateStats(userId) {
  try {
    // 현재 통계 가져오기
    const statsDoc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('stats')
      .doc('current')
      .get();

    const currentStats = statsDoc.exists
      ? statsDoc.data()
      : {
          currentStreak: 0,
          longestStreak: 0,
          totalCheckIns: 0,
          perfectWeeks: 0,
          badges: [],
          monthlyStats: {},
        };

    // Streak 계산
    const { currentStreak, longestStreak } = await calculateStreak(
      userId,
      currentStats.currentStreak,
      currentStats.longestStreak
    );

    // 총 체크인 수
    const totalCheckIns = currentStats.totalCheckIns + 1;

    // Perfect weeks 계산
    const perfectWeeks = await calculatePerfectWeeks(userId);

    // 배지 확인
    const newBadges = checkNewBadges(currentStreak, currentStats.badges);
    const badges = [...new Set([...currentStats.badges, ...newBadges])];

    // 월별 통계
    const monthlyStats = await updateMonthlyStats(userId, currentStats.monthlyStats);

    return {
      currentStreak,
      longestStreak,
      totalCheckIns,
      perfectWeeks,
      badges,
      monthlyStats,
      updatedAt: admin.firestore.Timestamp.now(),
    };
  } catch (error) {
    console.error('통계 계산 실패:', error);
    throw error;
  }
}

/**
 * Streak 계산
 */
async function calculateStreak(userId, prevStreak, prevLongest) {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const yesterdayDoc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('checkIns')
      .doc(yesterdayStr)
      .get();

    let currentStreak;
    if (yesterdayDoc.exists) {
      currentStreak = prevStreak + 1;
    } else {
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
 * Perfect weeks 계산
 */
async function calculatePerfectWeeks(userId) {
  try {
    const checkInsSnapshot = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('checkIns')
      .orderBy('date', 'asc')
      .get();

    const checkInDates = checkInsSnapshot.docs.map((doc) => doc.id);

    let perfectWeeks = 0;
    let consecutiveDays = 1;
    let prevDate = null;

    for (const dateStr of checkInDates) {
      const currentDate = new Date(dateStr);

      if (prevDate) {
        const diffDays = Math.floor(
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          consecutiveDays++;
          if (consecutiveDays === 7) {
            perfectWeeks++;
            consecutiveDays = 0;
          }
        } else {
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
 * 새 배지 확인
 */
function checkNewBadges(currentStreak, existingBadges) {
  const newBadges = [];
  const badgeTiers = [
    { streak: 7, name: 'week_1' },
    { streak: 14, name: 'week_2' },
    { streak: 21, name: 'week_3' },
    { streak: 30, name: 'month_1' },
    { streak: 60, name: 'month_2' },
    { streak: 90, name: 'month_3' },
    { streak: 180, name: 'half_year' },
    { streak: 365, name: 'year' },
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
async function updateMonthlyStats(userId, prevMonthlyStats) {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthCheckIns = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .collection('checkIns')
      .where('date', '>=', monthStart.toISOString().split('T')[0])
      .where('date', '<=', monthEnd.toISOString().split('T')[0])
      .get();

    const checkInCount = monthCheckIns.size;
    const daysInMonth = monthEnd.getDate();
    const achievementRate = Math.round((checkInCount / daysInMonth) * 100);

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
