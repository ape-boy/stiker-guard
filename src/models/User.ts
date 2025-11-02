import { Timestamp } from '@react-native-firebase/firestore';
import { AccountStatus } from '@utils/constants';

/**
 * 사용자 데이터 모델
 */
export interface User {
  userId: string;
  companyLocation: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  accountStatus: AccountStatus;
  createdAt: Timestamp;
  lastEnteredCompany: Timestamp | null;
  checkInDeadline: Timestamp | null;
  lockedAt?: Timestamp;
  lockReason?: string;
}

/**
 * 사용자 생성 DTO
 */
export interface CreateUserDto {
  companyLocation: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

/**
 * 사용자 업데이트 DTO
 */
export interface UpdateUserDto {
  lastEnteredCompany?: Timestamp;
  checkInDeadline?: Timestamp;
  accountStatus?: AccountStatus;
  lockedAt?: Timestamp;
  lockReason?: string;
}
