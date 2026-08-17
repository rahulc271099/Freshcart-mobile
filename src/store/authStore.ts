import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '../services/storage/mmkv';

/**
 * Client-side session state only — this is NOT where server-fetched user
 * profile data lives (that belongs in TanStack Query, per the project's
 * server-state/client-state split). This store just answers "are we
 * authenticated right now, and with what token", persisted locally via MMKV
 * so the session survives an app restart.
 *
 * No sign-in/sign-up business logic lives here yet — that's a feature-level
 * concern for `features/auth` in a later step.
 */
type AuthState = {
  sessionToken: string | null;
  isAuthenticated: boolean;
  setSession: (token: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      sessionToken: null,
      isAuthenticated: false,
      setSession: (token: string) =>
        set({ sessionToken: token, isAuthenticated: true }),
      clearSession: () => set({ sessionToken: null, isAuthenticated: false }),
    }),
    {
      name: 'freshcart-auth',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
