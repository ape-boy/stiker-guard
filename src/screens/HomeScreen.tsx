import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuthStore } from '@stores/authStore';
import { useLocationStore } from '@stores/locationStore';
import { useCheckInStore } from '@stores/checkInStore';
import { useTimerStore } from '@stores/timerStore';
import { COLORS } from '@utils/constants';

interface HomeScreenProps {
  navigation: any; // React Navigation 타입
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { userId, isAccountLocked } = useAuthStore();
  const { isWithinCompany, distanceToCompany } = useLocationStore();
  const { hasCheckedToday, currentStreak } = useCheckInStore();
  const { isActive, remainingSeconds, deadline } = useTimerStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 계정 잠금 상태 확인
  useEffect(() => {
    if (isAccountLocked) {
      navigation.replace('AccountLocked');
    }
  }, [isAccountLocked, navigation]);

  // 남은 시간 포맷 (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 거리 포맷
  const formatDistance = (distance: number | null): string => {
    if (distance === null) return '측정 중...';
    if (distance < 1000) return `${Math.round(distance)}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  // 타이머 진행률 계산 (0-1)
  const getTimerProgress = (): number => {
    if (!isActive || !deadline) return 0;
    const total = 45 * 60; // 45분
    const elapsed = total - remainingSeconds;
    return Math.max(0, Math.min(1, elapsed / total));
  };

  // 체크인 버튼 핸들러
  const handleCheckIn = () => {
    if (!isWithinCompany) {
      Alert.alert(
        '위치 확인',
        '회사 300m 반경 내에 있어야 체크할 수 있습니다.',
        [{ text: '확인' }]
      );
      return;
    }

    if (hasCheckedToday) {
      Alert.alert(
        '이미 체크 완료',
        '오늘은 이미 스티커를 체크하셨습니다!',
        [{ text: '확인' }]
      );
      return;
    }

    navigation.navigate('CheckIn');
  };

  // 타이머 상태에 따른 배경색
  const getTimerColor = (): string => {
    if (!isActive) return COLORS.SUCCESS;
    if (remainingSeconds > 30 * 60) return COLORS.SUCCESS; // 30분 이상
    if (remainingSeconds > 15 * 60) return COLORS.WARNING; // 15분 이상
    return COLORS.ERROR; // 15분 미만
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>스티커 가드</Text>
        <Text style={styles.headerSubtitle}>
          {currentTime.toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </Text>
      </View>

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        {/* 연속 기록 카드 */}
        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>연속 기록</Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakUnit}>일</Text>
          {currentStreak >= 7 && (
            <Text style={styles.streakBadge}>
              {currentStreak >= 30 ? '🔥 완벽해요!' : '✨ 잘하고 있어요!'}
            </Text>
          )}
        </View>

        {/* 위치 상태 */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>📍 위치 상태</Text>
            <View
              style={[
                styles.statusBadge,
                isWithinCompany ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isWithinCompany
                    ? styles.statusActiveText
                    : styles.statusInactiveText,
                ]}
              >
                {isWithinCompany ? '회사 반경 내' : '회사 외부'}
              </Text>
            </View>
          </View>
          <Text style={styles.statusDistance}>
            회사까지: {formatDistance(distanceToCompany)}
          </Text>
        </View>

        {/* 체크인 상태 */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>✅ 오늘 체크</Text>
            <View
              style={[
                styles.statusBadge,
                hasCheckedToday ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  hasCheckedToday
                    ? styles.statusActiveText
                    : styles.statusInactiveText,
                ]}
              >
                {hasCheckedToday ? '완료' : '미완료'}
              </Text>
            </View>
          </View>
        </View>

        {/* 타이머 카드 (활성화 시에만 표시) */}
        {isActive && deadline && (
          <View style={[styles.timerCard, { borderColor: getTimerColor() }]}>
            <Text style={styles.timerLabel}>남은 시간</Text>
            <Text style={[styles.timerTime, { color: getTimerColor() }]}>
              {formatTime(remainingSeconds)}
            </Text>

            {/* 진행 바 */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${getTimerProgress() * 100}%`,
                    backgroundColor: getTimerColor(),
                  },
                ]}
              />
            </View>

            <Text style={styles.timerWarning}>
              {remainingSeconds <= 15 * 60
                ? '⚠️ 시간이 얼마 남지 않았습니다!'
                : '💚 여유있게 체크하세요'}
            </Text>
          </View>
        )}

        {/* 체크인 버튼 */}
        <TouchableOpacity
          style={[
            styles.checkInButton,
            (!isWithinCompany || hasCheckedToday) &&
              styles.checkInButtonDisabled,
          ]}
          onPress={handleCheckIn}
          disabled={!isWithinCompany || hasCheckedToday}
        >
          <Text style={styles.checkInButtonText}>
            {hasCheckedToday
              ? '✓ 오늘 체크 완료'
              : isWithinCompany
              ? '📷 스티커 체크하기'
              : '📍 회사 근처에서 체크 가능'}
          </Text>
        </TouchableOpacity>

        {/* 안내 메시지 */}
        {!hasCheckedToday && isWithinCompany && !isActive && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 입문 전에 스티커 체크를 완료하세요!
            </Text>
            <Text style={styles.infoSubtext}>
              체크하지 않으면 45분 후 계정이 잠깁니다.
            </Text>
          </View>
        )}
      </View>

      {/* 하단 네비게이션 (추후 구현) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton}>
          <Text style={styles.navButtonText}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Stats')}
        >
          <Text style={styles.navButtonText}>통계</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.navButtonText}>설정</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  streakUnit: {
    fontSize: 20,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },
  streakBadge: {
    fontSize: 14,
    color: COLORS.SUCCESS,
    marginTop: 12,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusActiveText: {
    color: COLORS.SUCCESS,
  },
  statusInactiveText: {
    color: COLORS.ERROR,
  },
  statusDistance: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerLabel: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  timerTime: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerWarning: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkInButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  checkInButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.INFO,
  },
  infoText: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 12,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});
