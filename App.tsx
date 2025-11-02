import React, { useEffect } from 'react';
import { StatusBar, Alert, Platform } from 'react-native';
import { AppNavigator } from '@/src/navigation/AppNavigator';
import { useAuthStore } from '@stores/authStore';
import { useLocationStore } from '@stores/locationStore';
import { useLocationTracking } from '@hooks/useLocationTracking';
import { notificationService } from '@services/notificationService';
import { lockService } from '@services/lockService';
import { signInAnonymously, onAuthStateChanged } from '@/src/api/firebaseApi';
import { validateFirebaseSetup } from '@/src/config/firebase';

/**
 * 스티커 가드 - 메인 앱 컴포넌트
 *
 * 기능:
 * - Firebase 초기화 및 익명 인증
 * - 위치 추적 초기화 (회사 300m 반경 감지)
 * - 알림 권한 요청
 * - 계정 상태 확인 (잠금 여부)
 */
const App: React.FC = () => {
  const { userId, setUserId, isAccountLocked } = useAuthStore();
  const { startMonitoring, stopMonitoring } = useLocationTracking();

  /**
   * 앱 초기화
   */
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 스티커 가드 앱 초기화 시작');

      try {
        // 0. Firebase 설정 검증
        const validation = await validateFirebaseSetup();
        if (!validation.success) {
          console.error('Firebase 설정 오류:', validation.errors);
          Alert.alert(
            'Firebase 설정 오류',
            validation.errors.join('\n') + '\n\n자세한 내용은 USER_GUIDE.md를 참고하세요.',
            [{ text: '확인' }]
          );
          return;
        }

        console.log('✅ Firebase 설정 검증 완료');

        // 1. 알림 권한 요청
        const notificationGranted = await notificationService.requestPermission();
        if (!notificationGranted) {
          Alert.alert(
            '알림 권한 필요',
            '체크인 알림을 받으려면 알림 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [{ text: '확인' }]
          );
        }

        // 2. 알림 채널 생성 (Android)
        await notificationService.createChannel();

        // 3. Firebase 익명 인증
        let currentUserId = userId;
        if (!currentUserId) {
          currentUserId = await signInAnonymously();
          setUserId(currentUserId);
          console.log('✅ 익명 인증 완료:', currentUserId);
        }

        // 4. 계정 상태 확인
        const locked = await lockService.checkAccountStatus(currentUserId);
        if (locked) {
          console.log('⚠️ 계정 잠금 상태 감지');
          return; // 잠금 상태면 위치 추적 시작하지 않음
        }

        // 5. 위치 추적 시작
        console.log('📍 위치 추적 시작');
        await startMonitoring(currentUserId);

        console.log('✅ 앱 초기화 완료');
      } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        Alert.alert(
          '초기화 오류',
          '앱 초기화 중 문제가 발생했습니다. 앱을 재시작해주세요.',
          [{ text: '확인' }]
        );
      }
    };

    initialize();

    // Firebase 인증 상태 리스너
    const unsubscribe = onAuthStateChanged((authUserId) => {
      if (authUserId) {
        setUserId(authUserId);
        console.log('🔄 인증 상태 변경:', authUserId);
      } else {
        console.log('⚠️ 인증 해제됨');
      }
    });

    // Cleanup: 컴포넌트 언마운트 시
    return () => {
      console.log('🛑 위치 추적 중지');
      stopMonitoring();
      unsubscribe();
    };
  }, []);

  /**
   * 계정 잠금 상태 모니터링
   */
  useEffect(() => {
    if (isAccountLocked) {
      console.log('🔒 계정 잠금 - 위치 추적 중지');
      stopMonitoring();
    }
  }, [isAccountLocked]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </>
  );
};

export default App;
