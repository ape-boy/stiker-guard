import { create } from 'zustand';
import { CheckInStatus } from '@utils/constants';

/**
 * 체크인 상태 관리 Store
 */
interface CheckInState {
  // 상태
  todayStatus: CheckInStatus;
  lastCheckIn: Date | null;
  isChecking: boolean;
  hasCheckedToday: boolean; // 오늘 체크 여부
  currentStreak: number; // 현재 연속 기록

  // Actions
  setStatus: (status: CheckInStatus) => void;
  setLastCheckIn: (date: Date | null) => void;
  setChecking: (checking: boolean) => void;
  setCheckedToday: (checked: boolean) => void;
  setCurrentStreak: (streak: number) => void;
  reset: () => void;
}

const initialState = {
  todayStatus: CheckInStatus.NOT_CHECKED,
  lastCheckIn: null,
  isChecking: false,
  hasCheckedToday: false,
  currentStreak: 0,
};

export const useCheckInStore = create<CheckInState>((set) => ({
  ...initialState,

  setStatus: (status) =>
    set({
      todayStatus: status,
      hasCheckedToday: status === CheckInStatus.CHECKED, // 자동 동기화
    }),

  setLastCheckIn: (date) => set({ lastCheckIn: date }),

  setChecking: (checking) => set({ isChecking: checking }),

  setCheckedToday: (checked) =>
    set({
      hasCheckedToday: checked,
      todayStatus: checked ? CheckInStatus.CHECKED : CheckInStatus.NOT_CHECKED, // 자동 동기화
    }),

  setCurrentStreak: (streak) => set({ currentStreak: streak }),

  reset: () => set(initialState),
}));
