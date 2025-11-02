import { create } from 'zustand';
import { AccountStatus } from '@utils/constants';

/**
 * 인증 및 계정 상태 관리 Store
 */
interface AuthState {
  // 상태
  userId: string | null;
  accountStatus: AccountStatus;
  isAccountLocked: boolean;
  lockedAt: Date | null;
  lockReason: string | null;

  // Actions
  setUserId: (id: string | null) => void;
  setAccountStatus: (status: AccountStatus) => void;
  setAccountLocked: (locked: boolean, reason?: string) => void;
  setLockedAt: (date: Date | null) => void;
  reset: () => void;
}

const initialState = {
  userId: null,
  accountStatus: AccountStatus.ACTIVE,
  isAccountLocked: false,
  lockedAt: null,
  lockReason: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUserId: (id) => set({ userId: id }),

  setAccountStatus: (status) =>
    set({
      accountStatus: status,
      isAccountLocked: status === AccountStatus.LOCKED,
    }),

  setAccountLocked: (locked, reason) =>
    set((state) => ({
      isAccountLocked: locked,
      accountStatus: locked ? AccountStatus.LOCKED : AccountStatus.ACTIVE,
      lockReason: reason || null,
      // ⚡ MEDIUM #3 수정: lockedAt은 이미 있으면 유지 (서버 시각 존중)
      lockedAt: locked ? (state.lockedAt || new Date()) : null,
    })),

  setLockedAt: (date) => set({ lockedAt: date }),

  reset: () => set(initialState),
}));
