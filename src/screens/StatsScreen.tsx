import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '@stores/authStore';
import { useCheckInStore } from '@stores/checkInStore';
import { COLORS, BADGE_TIERS } from '@utils/constants';
import { statsService } from '@services/statsService';

interface StatsScreenProps {
  navigation: any;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const { userId } = useAuthStore();
  const { currentStreak } = useCheckInStore();

  const [stats, setStats] = useState({
    longestStreak: 0,
    totalCheckIns: 0,
    perfectWeeks: 0,
    badges: [] as string[],
    thisMonthRate: 0,
    lastMonthRate: 0,
  });

  const [loading, setLoading] = useState(true);

  // ⚡ HIGH #6 수정: 실제 통계 데이터 로드
  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const statsData = await statsService.getStats(userId);

        // 이번 달/지난 달 달성률 계산
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

        const thisMonthRate = statsData.monthlyStats[currentMonth]?.achievementRate || 0;
        const lastMonthRate = statsData.monthlyStats[lastMonthKey]?.achievementRate || 0;

        setStats({
          longestStreak: statsData.longestStreak,
          totalCheckIns: statsData.totalCheckIns,
          perfectWeeks: statsData.perfectWeeks,
          badges: statsData.badges,
          thisMonthRate,
          lastMonthRate,
        });
      } catch (error) {
        console.error('❌ 통계 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 통계</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 주요 통계 */}
        <View style={styles.mainStats}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{currentStreak}</Text>
            <Text style={styles.statLabel}>현재 연속</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>최장 연속</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalCheckIns}</Text>
            <Text style={styles.statLabel}>총 체크인</Text>
          </View>
        </View>

        {/* 배지 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 획득한 배지</Text>
          {stats.badges.length > 0 ? (
            <View style={styles.badgeContainer}>
              {stats.badges.map((badge, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              아직 획득한 배지가 없습니다. 7일 연속 체크하면 첫 배지를 받을 수
              있어요!
            </Text>
          )}
        </View>

        {/* 월별 달성률 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 월별 달성률</Text>
          <View style={styles.monthRow}>
            <Text style={styles.monthLabel}>이번 달</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.thisMonthRate}%` },
                ]}
              />
            </View>
            <Text style={styles.percentText}>{stats.thisMonthRate}%</Text>
          </View>
          <View style={styles.monthRow}>
            <Text style={styles.monthLabel}>지난 달</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.lastMonthRate}%` },
                ]}
              />
            </View>
            <Text style={styles.percentText}>{stats.lastMonthRate}%</Text>
          </View>
        </View>

        {/* 완벽한 주 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ 완벽한 주</Text>
          <Text style={styles.largeNumber}>{stats.perfectWeeks}</Text>
          <Text style={styles.subtitle}>
            일주일 동안 하루도 빠짐없이 체크한 주
          </Text>
        </View>

        {/* 배지 획득 조건 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 배지 획득 조건</Text>
          {Object.entries(BADGE_TIERS).map(([key, badge]) => (
            <View key={key} style={styles.badgeRequirement}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <View style={styles.badgeInfo}>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
              </View>
              <Text style={styles.badgeCheck}>
                {currentStreak >= badge.requiredStreak ? '✓' : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    width: 70,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 4,
  },
  percentText: {
    width: 45,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    textAlign: 'right',
  },
  largeNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  badgeRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  badgeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  badgeDesc: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  badgeCheck: {
    fontSize: 20,
    color: COLORS.SUCCESS,
    width: 30,
    textAlign: 'center',
  },
  bottomSpace: {
    height: 40,
  },
});
