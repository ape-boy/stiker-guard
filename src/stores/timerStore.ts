import { create } from 'zustand';

/**
 * 타이머 상태 관리 Store
 */
interface TimerState {
  // 상태
  isActive: boolean;
  deadline: Date | null;
  remainingSeconds: number;

  // Actions
  startTimer: (deadline: Date) => void;
  stopTimer: () => void;
  updateRemaining: (seconds: number) => void;
  reset: () => void;
}

const initialState = {
  isActive: false,
  deadline: null,
  remainingSeconds: 0,
};

export const useTimerStore = create<TimerState>((set) => ({
  ...initialState,

  startTimer: (deadline) =>
    set({
      isActive: true,
      deadline,
      remainingSeconds: Math.max(
        0,
        Math.floor((deadline.getTime() - Date.now()) / 1000)
      ),
    }),

  stopTimer: () =>
    set({
      isActive: false,
      deadline: null,
      remainingSeconds: 0,
    }),

  updateRemaining: (seconds) =>
    set({ remainingSeconds: Math.max(0, seconds) }),

  reset: () => set(initialState),
}));
