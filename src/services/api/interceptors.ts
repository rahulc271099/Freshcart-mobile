import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

import API_CONFIG from '@/config/api';
import { DEFAULT_LANGUAGE_KEY } from '@/constants/app';
import { MAX_REFRESH_ATTEMPTS } from '@/constants/auth';
import { refreshToken as refreshTokenRequest } from '@/features/auth/api/authApi';
import { clearTokens, getTokens, saveTokens } from '@/services/storage/mmkv';
import { useAuthStore } from '@/store/authStore';

import type { Session } from './types';

/** Axios doesn't type a "have we already retried this once" flag. */
interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshTokenAttempts = 0;

// Dedupe concurrent 401s. If five requests fail at once because the access
// token just expired, they must all await the SAME refresh call and retry
// with its result — not each fire their own refresh, which would race to
// overwrite the stored tokens and burn through MAX_REFRESH_ATTEMPTS on a
// single expiry instead of one.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (session: Session): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    if (refreshTokenAttempts >= MAX_REFRESH_ATTEMPTS) {
      throw new Error('Maximum token refresh attempts exceeded');
    }
    refreshTokenAttempts += 1;

    try {
      const response = await refreshTokenRequest(session.refreshToken);
      saveTokens(response);
      // Refresh succeeded, so the session is healthy again. Reset the
      // counter so a later, unrelated 401 burst (e.g. tomorrow) gets its
      // own full attempt budget instead of inheriting today's failures.
      refreshTokenAttempts = 0;
      useAuthStore.getState().setSession(response.accessToken);
      return response.accessToken;
    } finally {
      // Release the lock whether refresh succeeded or failed, so the next
      // 401 (e.g. after the user logs back in) can start a fresh cycle.
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const requestInterceptor = (
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig => {
  const session = getTokens();

  config.headers.set('x-lang', DEFAULT_LANGUAGE_KEY);
  config.headers.set('x-user-agent', API_CONFIG.USER_AGENT);
  config.headers.set('x-app-version', API_CONFIG.APP_VERSION);

  // Preserves the old callApi()'s behavior of sending `lang` as a query
  // param on every request, in addition to the `x-lang` header — kept in
  // case the backend reads it from the query string rather than headers.
  // Safe to drop this block if that's not the case.
  config.params = { lang: DEFAULT_LANGUAGE_KEY, ...config.params };

  // Unlike the old interceptor, we only attach Authorization when we
  // actually have a token — the old version sent a literal
  // "Bearer undefined" header on every unauthenticated request (login,
  // signup, etc.), which is harmless but sloppy and worth not carrying
  // forward.
  if (session?.accessToken) {
    config.headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  return config;
};

/**
 * Registered once from app start-up (e.g. `AppProvider`) so this module
 * doesn't need to know HOW to log the user out — only THAT it should.
 * Keeps this file free of navigation/UI concerns.
 */
let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (fn: () => void): void => {
  logoutHandler = fn;
};

const handleAuthError = (): void => {
  clearTokens();
  useAuthStore.getState().clearSession();
  logoutHandler?.();
};

/**
 * Returns the response-error interceptor. It takes the `api` Axios
 * instance as a parameter (rather than importing it from `./api`) so this
 * file has no load-order dependency on `services/api/api.ts` — which
 * itself imports this file to register the interceptors. That would
 * otherwise be a real circular import; passing the instance in avoids it
 * entirely.
 */
export const createResponseErrorInterceptor =
  (api: AxiosInstance) =>
  async (error: AxiosError): Promise<unknown> => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      // Already retried this exact request once with a freshly refreshed
      // token and it STILL got a 401 — the refresh token itself is no
      // longer valid. Stop here instead of looping.
      handleAuthError();
      return Promise.reject(error);
    }

    const session = getTokens();
    if (!session?.refreshToken) {
      // 401 with no refresh token to try — this is the "logged in on
      // another device" / session-was-revoked case.
      handleAuthError();
      return Promise.reject(error);
    }

    try {
      const accessToken = await refreshAccessToken(session);
      originalRequest._retry = true;
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
      // Retry through the real Axios instance so the request actually goes
      // back out over the network with the new token, instead of just
      // returning a config object (which axios interceptors do NOT retry
      // automatically).
      return api(originalRequest);
    } catch (refreshError) {
      handleAuthError();
      return Promise.reject(refreshError);
    }
  };
