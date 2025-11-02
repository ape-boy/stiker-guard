/**
 * Firebase 초기화 설정
 *
 * 주의: GoogleService-Info.plist 파일이 ios/ 폴더에 있어야 합니다.
 * Firebase Console에서 다운로드 후 프로젝트에 추가하세요.
 */

// Firebase는 React Native Firebase 패키지가 네이티브에서 자동 초기화
// 별도의 초기화 코드가 필요 없음 (GoogleService-Info.plist 기반)

/**
 * Firebase 프로젝트 설정 정보
 *
 * 이 정보는 GoogleService-Info.plist에서 자동으로 읽힙니다.
 * 수동 설정이 필요한 경우만 아래 값들을 참고하세요.
 */
export const FIREBASE_CONFIG = {
  // 프로젝트 ID는 Firebase Console에서 확인
  // 예: stickerguard-abc123
  projectId: process.env.FIREBASE_PROJECT_ID || '',

  // Firestore 리전 (기본값: 아시아)
  firestoreRegion: 'asia-northeast3', // 서울 리전

  // Functions 리전
  functionsRegion: 'asia-northeast3',

  // Storage 버킷 (이미지 저장 시 사용)
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
} as const;

/**
 * Firestore 컬렉션 경로 상수
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  CHECK_INS: 'checkIns',
  STATS: 'stats',
} as const;

/**
 * Firebase 연결 상태 확인
 */
export async function checkFirebaseConnection(): Promise<boolean> {
  try {
    const firestore = require('@react-native-firebase/firestore').default;

    // 간단한 읽기 테스트
    await firestore().collection('_health').doc('check').get();

    console.log('✅ Firebase 연결 성공');
    return true;
  } catch (error) {
    console.error('❌ Firebase 연결 실패:', error);
    return false;
  }
}

/**
 * Firebase 초기화 체크리스트
 *
 * 앱 시작 시 확인해야 할 항목:
 * 1. GoogleService-Info.plist 파일 존재 확인
 * 2. Firebase 프로젝트 설정 확인
 * 3. Firestore 데이터베이스 생성 확인
 * 4. Anonymous Authentication 활성화 확인
 * 5. Security Rules 배포 확인
 */
export async function validateFirebaseSetup(): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // 1. Firestore 연결 테스트
    const isConnected = await checkFirebaseConnection();
    if (!isConnected) {
      errors.push('Firestore 연결 실패 - 프로젝트 설정을 확인하세요');
    }

    // 2. Anonymous Auth 테스트
    const auth = require('@react-native-firebase/auth').default;
    try {
      await auth().signInAnonymously();
      console.log('✅ Anonymous Auth 성공');
      // ⚡ MEDIUM #4 수정: 테스트 계정 정리
      await auth().signOut();
      console.log('✅ 테스트 계정 로그아웃 완료');
    } catch (authError: any) {
      errors.push(`Anonymous Auth 실패: ${authError.message}`);
    }

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    errors.push(`Firebase 검증 실패: ${error.message}`);
    return {
      success: false,
      errors,
    };
  }
}
