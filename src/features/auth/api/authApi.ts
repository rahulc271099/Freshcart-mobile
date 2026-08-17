import { api } from '@/services/api/api';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Exchanges the current refresh token for a new access/refresh token pair.
 *
 * Called from two places: silently, by the response interceptor in
 * `services/api/interceptors.ts` on a 401; and potentially, later, by an
 * explicit TanStack Query hook (e.g. `features/auth/hooks/useRefreshToken`)
 * if a screen ever needs to trigger a refresh directly. This function stays
 * a plain API call with no query-layer or token-storage knowledge, per the
 * project's UI → query hook → feature API → `services/api` layering.
 */
export const refreshToken = async (
  refreshTokenValue: string,
): Promise<RefreshTokenResponse> => {
  const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', {
    rt: refreshTokenValue,
  });
  return response.data;
};
