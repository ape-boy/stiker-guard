import { create } from 'zustand';

/**
 * 위치 추적 상태 관리 Store
 */
interface LocationState {
  // 상태
  isWithinCompany: boolean;
  isMonitoring: boolean;
  lastEntered: Date | null;
  distanceToCompany: number | null;

  // Actions
  setEntered: (entered: boolean) => void;
  setMonitoring: (monitoring: boolean) => void;
  setLastEntered: (date: Date | null) => void;
  setDistance: (distance: number | null) => void;
  reset: () => void;
}

const initialState = {
  isWithinCompany: false,
  isMonitoring: false,
  lastEntered: null,
  distanceToCompany: null,
};

export const useLocationStore = create<LocationState>((set) => ({
  ...initialState,

  setEntered: (entered) => set({ isWithinCompany: entered }),

  setMonitoring: (monitoring) => set({ isMonitoring: monitoring }),

  setLastEntered: (date) => set({ lastEntered: date }),

  setDistance: (distance) => set({ distanceToCompany: distance }),

  reset: () => set(initialState),
}));
