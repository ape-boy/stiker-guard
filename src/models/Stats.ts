import { Timestamp } from '@react-native-firebase/firestore';

/**
 * 월별 통계
 */
export interface MonthlyStats {
  checkInDays: number;
  totalDays: number;
  achievementRate: number; // 퍼센트
}

/**
 * 통계 데이터 모델
 */
export interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  perfectWeeks: number;
  badges: string[];
  monthlyStats: Record<string, MonthlyStats>; // { '2025-11': {...} }
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}

/**
 * 배지 정보
 */
export interface Badge {
  name: string;
  icon: string;
  description: string;
  unlockedAt?: Date;
}
