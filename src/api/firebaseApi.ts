import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { FIRESTORE_COLLECTIONS } from '@config/firebase';

/**
 * Firebase API 래퍼
 *
 * 모든 Firebase 작업을 중앙화하여 관리
 */

/**
 * 익명 인증
 */
export async function signInAnonymously(): Promise<string> {
  try {
    const userCredential = await auth().signInAnonymously();
    const userId = userCredential.user.uid;

    console.log('✅ 익명 인증 성공:', userId);

    // 사용자 문서 생성 (없으면)
    await initializeUserDocument(userId);

    return userId;
  } catch (error) {
    console.error('❌ 익명 인증 실패:', error);
    throw error;
  }
}

/**
 * 현재 인증된 사용자 ID 가져오기
 */
export function getCurrentUserId(): string | null {
  const currentUser = auth().currentUser;
  return currentUser ? currentUser.uid : null;
}

/**
 * 사용자 문서 초기화
 */
async function initializeUserDocument(userId: string): Promise<void> {
  try {
    const userRef = firestore().collection(FIRESTORE_COLLECTIONS.USERS).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        createdAt: firestore.Timestamp.now(),
        accountStatus: 'active',
        lastEnteredCompany: null,
        checkInDeadline: null,
      });

      console.log('✅ 사용자 문서 생성:', userId);
    }
  } catch (error) {
    console.error('❌ 사용자 문서 초기화 실패:', error);
    throw error;
  }
}

/**
 * 현재 인증 상태 리스너
 */
export function onAuthStateChanged(callback: (userId: string | null) => void): () => void {
  return auth().onAuthStateChanged((user) => {
    callback(user ? user.uid : null);
  });
}

/**
 * 로그아웃 (Anonymous Auth는 로그아웃 시 계정 삭제됨)
 */
export async function signOut(): Promise<void> {
  try {
    await auth().signOut();
    console.log('✅ 로그아웃 성공');
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
    throw error;
  }
}
