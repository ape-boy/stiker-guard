import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView } from '@components/checkin/CameraView';
import { useAuthStore } from '@stores/authStore';
import { useLocationStore } from '@stores/locationStore';
import { useCheckInStore } from '@stores/checkInStore';
import { useTimerStore } from '@stores/timerStore';
import { checkInService } from '@services/checkInService';
import { timerService } from '@services/timerService';
import { COLORS } from '@utils/constants';

interface CheckInScreenProps {
  navigation: any; // React Navigation 타입
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({ navigation }) => {
  const { userId } = useAuthStore();
  const { isWithinCompany } = useLocationStore();
  const { setCheckedToday } = useCheckInStore();
  const { isActive, stopTimer } = useTimerStore();

  const [step, setStep] = useState<'guide' | 'camera' | 'processing'>('guide');
  const [loading, setLoading] = useState(false);

  // 회사 외부면 홈으로 돌아가기
  useEffect(() => {
    if (!isWithinCompany) {
      Alert.alert(
        '위치 확인 필요',
        '회사 300m 반경 내에 있어야 체크할 수 있습니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [isWithinCompany, navigation]);

  // 카메라 시작 핸들러
  const handleStartCamera = () => {
    setStep('camera');
  };

  // 스티커 확인 핸들러
  const handleStickerConfirm = async (hasSticker: boolean) => {
    if (!userId) {
      Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setStep('processing');
    setLoading(true);

    try {
      // 체크인 완료 처리
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const result = await checkInService.completeCheckIn(userId, {
        date: today,
        hasSticker,
        timestamp: new Date(),
      });

      // Zustand 상태 업데이트
      setCheckedToday(true);

      // ⚡ MEDIUM #1 수정: checkInService가 이미 타이머를 취소하므로 중복 호출 제거
      // (checkInService.ts:37-38에서 timerService.cancelTimer 호출)

      setLoading(false);

      // 결과에 따른 메시지
      if (hasSticker) {
        Alert.alert(
          '✅ 체크 완료!',
          `훌륭해요! 현재 연속 기록: ${result.streak}일\n총 체크인: ${result.totalCheckIns}회`,
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      } else {
        Alert.alert(
          '⚠️ 스티커 미부착',
          '스티커가 부착되지 않았습니다.\n입문 전에 반드시 부착해주세요!',
          [
            {
              text: '확인',
              onPress: () => navigation.navigate('Home'),
            },
          ]
        );
      }
    } catch (error) {
      setLoading(false);
      setStep('guide');
      console.error('체크인 처리 실패:', error);
      Alert.alert(
        '오류',
        '체크인 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  // 카메라 닫기 핸들러
  const handleCameraClose = () => {
    setStep('guide');
  };

  // 가이드 화면
  const renderGuide = () => (
    <View style={styles.guideContainer}>
      <Text style={styles.guideTitle}>📷 스티커 체크 가이드</Text>

      <View style={styles.guideCard}>
        <Text style={styles.guideStep}>1️⃣ 카메라 준비</Text>
        <Text style={styles.guideText}>
          후면 카메라로 노트북/태블릿을 비춰주세요
        </Text>
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideStep}>2️⃣ 스티커 확인</Text>
        <Text style={styles.guideText}>
          카메라에 스티커가 부착되어 있는지 직접 확인하세요
        </Text>
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideStep}>3️⃣ 결과 선택</Text>
        <Text style={styles.guideText}>
          스티커 부착 여부를 정직하게 선택해주세요
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ 중요 안내</Text>
        <Text style={styles.warningText}>
          • 정직한 체크가 보안의 첫걸음입니다
        </Text>
        <Text style={styles.warningText}>
          • 스티커 미부착 시 입문 전 반드시 부착하세요
        </Text>
        <Text style={styles.warningText}>
          • 체크하지 않으면 45분 후 계정이 잠깁니다
        </Text>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartCamera}
      >
        <Text style={styles.startButtonText}>카메라 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>취소</Text>
      </TouchableOpacity>
    </View>
  );

  // 처리 중 화면
  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      <Text style={styles.processingText}>체크인 처리 중...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      {step !== 'camera' && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>스티커 체크</Text>
          <View style={styles.placeholder} />
        </View>
      )}

      {/* 콘텐츠 */}
      {step === 'guide' && renderGuide()}
      {step === 'camera' && (
        <CameraView
          onStickerConfirm={handleStickerConfirm}
          onClose={handleCameraClose}
        />
      )}
      {step === 'processing' && renderProcessing()}
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
  guideContainer: {
    flex: 1,
    padding: 20,
  },
  guideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
    textAlign: 'center',
  },
  guideCard: {
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
  guideStep: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  guideText: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.WARNING,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: 4,
  },
  startButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDBDBD',
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  processingText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 16,
  },
});
