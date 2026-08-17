import { createMMKV } from 'react-native-mmkv';

import type { Session } from '@/services/api/types';

/**
 * Single shared MMKV instance for fast local key/value persistence.
 *
 * Do not create ad-hoc `createMMKV()` instances elsewhere — import
 * `appStorage` (or add a scoped instance here) so all local persistence
 * goes through one configured, discoverable place, per the project's
 * "centralized services" rule.
 */
export const appStorage = createMMKV({
  id: 'freshcart-app-storage',
});

/**
 * Storage adapter satisfying Zustand's `persist` middleware `StateStorage`
 * interface, backed by MMKV instead of AsyncStorage.
 *
 * Usage:
 *   persist(store, { name: 'auth', storage: createJSONStorage(() => mmkvStorage) })
 */
export const mmkvStorage = {
  getItem: (key: string): string | null => appStorage.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    appStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    appStorage.remove(key);
  },
};

const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';

/**
 * Raw, synchronous token storage — deliberately separate from the Zustand
 * `authStore`. The Axios interceptors in `services/api` run outside React
 * on every single request/response and need a token read that is
 * synchronous and immediately correct, without depending on `persist`
 * middleware rehydration timing on cold start.
 *
 * `authStore` still owns the *reactive* "is the user logged in" flag the
 * UI (e.g. `RootNavigator`) reads. The two are kept in sync by whoever
 * calls `saveTokens` / `clearTokens` — see `services/api/interceptors.ts`,
 * which updates both on refresh and on logout.
 */
export const getTokens = (): Session | null => {
  const accessToken = appStorage.getString(ACCESS_TOKEN_KEY);
  const refreshToken = appStorage.getString(REFRESH_TOKEN_KEY);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
};

export const saveTokens = (session: Session): void => {
  appStorage.set(ACCESS_TOKEN_KEY, session.accessToken);
  appStorage.set(REFRESH_TOKEN_KEY, session.refreshToken);
};

export const clearTokens = (): void => {
  appStorage.remove(ACCESS_TOKEN_KEY);
  appStorage.remove(REFRESH_TOKEN_KEY);
};
