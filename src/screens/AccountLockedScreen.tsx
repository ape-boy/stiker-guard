import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useAuthStore } from '@stores/authStore';
import { lockService } from '@services/lockService';
import { COLORS } from '@utils/constants';

interface AccountLockedScreenProps {
  navigation: any; // React Navigation 타입
}

export const AccountLockedScreen: React.FC<AccountLockedScreenProps> = ({
  navigation,
}) => {
  const { userId, lockReason, lockedAt } = useAuthStore();
  const [lockInfo, setLockInfo] = useState<{
    lockedAt: Date | null;
    lockReason: string | null;
    lostStreak: number;
    lostBadges: number;
    lostCheckIns: number;
  }>({
    lockedAt: null,
    lockReason: null,
    lostStreak: 0,
    lostBadges: 0,
    lostCheckIns: 0,
  });

  // 잠금 정보 조회
  useEffect(() => {
    const fetchLockInfo = async () => {
      if (!userId) return;

      try {
        const info = await lockService.getLockInfo(userId);
        setLockInfo(info);
      } catch (error) {
        console.error('잠금 정보 조회 실패:', error);
      }
    };

    fetchLockInfo();
  }, [userId]);

  // 앱 스토어로 이동
  const handleReinstall = () => {
    Alert.alert(
      '앱 재설치',
      '앱 스토어로 이동하여 앱을 삭제한 후 다시 설치하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '이동',
          onPress: () => {
            // TODO: 실제 앱 스토어 링크로 변경
            const appStoreUrl =
              'https://apps.apple.com/app/id[YOUR_APP_ID]';
            Linking.openURL(appStoreUrl).catch((err) =>
              console.error('앱 스토어 열기 실패:', err)
            );
          },
        },
      ]
    );
  };

  // 도움말 보기
  const handleHelp = () => {
    Alert.alert(
      '❓ 도움말',
      '계정 잠금 관련 문의사항은 다음 이메일로 연락주세요:\n\nsupport@stickerguard.com',
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '이메일 보내기',
          onPress: () => {
            Linking.openURL('mailto:support@stickerguard.com?subject=계정%20잠금%20문의');
          },
        },
      ]
    );
  };

  // 날짜 포맷
  const formatDate = (date: Date | null): string => {
    if (!date) return '알 수 없음';
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.ERROR} />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔒</Text>
        <Text style={styles.headerTitle}>계정이 잠겼습니다</Text>
        <Text style={styles.headerSubtitle}>
          보안 규정 위반으로 계정이 잠금 처리되었습니다
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 잠금 사유 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 잠금 사유</Text>
          <Text style={styles.reasonText}>
            {lockInfo.lockReason || lockReason || '알 수 없는 사유'}
          </Text>
          <Text style={styles.dateText}>
            잠금 시각: {formatDate(lockInfo.lockedAt || lockedAt)}
          </Text>
        </View>

        {/* 잃어버린 데이터 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 삭제된 데이터</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>최장 연속 기록</Text>
            <Text style={styles.statValue}>{lockInfo.lostStreak}일</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>획득한 배지</Text>
            <Text style={styles.statValue}>{lockInfo.lostBadges}개</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>총 체크인 횟수</Text>
            <Text style={styles.statValue}>{lockInfo.lostCheckIns}회</Text>
          </View>
          <Text style={styles.warningNote}>
            ⚠️ 모든 데이터가 영구적으로 삭제되었습니다
          </Text>
        </View>

        {/* 재설치 안내 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔄 계정 복구 방법</Text>
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              앱을 완전히 삭제합니다 (설정 &gt; 일반 &gt; iPhone 저장공간)
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              App Store에서 앱을 다시 설치합니다
            </Text>
          </View>
          <View style={styles.stepContainer}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              새로운 계정으로 처음부터 시작합니다
            </Text>
          </View>
        </View>

        {/* 예방 팁 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 다음부터 주의하세요</Text>
          <Text style={styles.tipText}>
            • 회사 300m 반경 진입 시 즉시 알림을 확인하세요
          </Text>
          <Text style={styles.tipText}>
            • 입문 전에 반드시 스티커 체크를 완료하세요
          </Text>
          <Text style={styles.tipText}>
            • 45분 타이머를 항상 확인하세요
          </Text>
          <Text style={styles.tipText}>
            • 알림을 절대 무시하지 마세요
          </Text>
        </View>

        {/* 버튼 영역 */}
        <TouchableOpacity style={styles.reinstallButton} onPress={handleReinstall}>
          <Text style={styles.reinstallButtonText}>앱 재설치하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
          <Text style={styles.helpButtonText}>도움말</Text>
        </TouchableOpacity>

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
    backgroundColor: COLORS.ERROR,
    padding: 32,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
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
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 16,
    color: COLORS.ERROR,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statLabel: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  warningNote: {
    fontSize: 13,
    color: COLORS.WARNING,
    marginTop: 12,
    fontStyle: 'italic',
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: 24,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    marginBottom: 6,
  },
  reinstallButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  reinstallButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  helpButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  helpButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  bottomSpace: {
    height: 40,
  },
});
