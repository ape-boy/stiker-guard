import { Timestamp } from '@react-native-firebase/firestore';

/**
 * 체크인 데이터 모델
 */
export interface CheckIn {
  date: string; // 'YYYY-MM-DD' 형식
  checkedAt: Timestamp | null;
  hasSticker: boolean;
  enteredAt: Timestamp;
}

/**
 * 체크인 생성 DTO
 */
export interface CreateCheckInDto {
  date: string;
  hasSticker: boolean;
  timestamp: Date;
}

/**
 * 체크인 결과
 */
export interface CheckInResult {
  success: boolean;
  streak: number;
  totalCheckIns: number;
  newBadges?: string[];
}
