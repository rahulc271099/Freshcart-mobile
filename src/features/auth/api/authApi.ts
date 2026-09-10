import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';

export interface LoginUserResponse {
  // TODO: replace with the real login response shape once the backend
  // contract is confirmed — left honest rather than guessed.
  [key: string]: unknown;
}

// ── Verify OTP ──────────────────────────────────────────────────────────────

export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
}

/**
 * Shape returned by POST /users/auth/otp/verify/.
 * The server issues access + refresh tokens once OTP is confirmed.
 */
export interface VerifyOtpResponse {
  data: {
    access_token: string;
    refresh_token: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokenApiResponse {
  data: {
    access_token: string;
    refresh_token: string;
  };
}

/**
 * Sends a login request for the given mobile number.
 * The server is expected to respond with an OTP delivery confirmation.
 *
 * Calls the shared `api` Axios instance directly — the `services/api/`
 * layer (interceptors.ts) handles auth headers, 401 token-refresh, and
 * logout. Reintroducing a `callApi(method, url, body)` dispatcher on top
 * would just duplicate what Axios already provides.
 */
export const loginUserApi = async ({
  mobile,
}: {
  mobile: string;
}): Promise<LoginUserResponse> => {
  console.log('🚀 ~ loginUserApi ~ mobile:', mobile);
  const response = await api.post<LoginUserResponse>(API_CONFIG.AUTH.LOGIN, {
    mobile_number: mobile,
    purpose: 'LOGIN',
  });
  console.log('🚀 ~ loginUserApi ~ response:', response.data);
  return response.data;
};

/**
 * Verifies the 6-digit OTP for the given mobile number.
 * On success the server returns access + refresh tokens — the caller
 * (useVerifyOtp hook) persists them via `saveTokens` and updates the
 * reactive auth store, exactly as `useLogin` does.
 */
export const verifyOtpApi = async ({
  mobile,
  otp,
}: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  const deviceId = await DeviceInfo.getUniqueId();
  const appVersion = DeviceInfo.getVersion();
  const osVersion = DeviceInfo.getSystemVersion();

  const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

  const payload = {
    mobile_number: mobile,
    otp,
    purpose: 'LOGIN',
    device: {
      device_type: deviceType,
      device_identifier: deviceId,
      push_token: '',
      app_version: appVersion,
      os_version: `${deviceType === 'IOS' ? 'iOS' : 'Android'} ${osVersion}`,
    },
  };

  console.log('[verifyOtpApi] payload:', JSON.stringify(payload, null, 2));

  const response = await api.post<VerifyOtpResponse>(
    API_CONFIG.AUTH.VERIFY_OTP,
    payload,
  );

  return response.data;
};

export const refreshToken = async (
  refreshTokenValue: string,
): Promise<RefreshTokenResponse> => {
  const response = await api.post<RefreshTokenApiResponse>(
    API_CONFIG.AUTH.REFRESH_TOKEN,
    { refresh_token: refreshTokenValue },
  );
  return {
    accessToken: response.data.data.access_token,
    refreshToken: response.data.data.refresh_token,
  };
};

// ── Logout ──────────────────────────────────────────────────────────────

export interface LogoutRequest {
  refresh_token: string;
}

/**
 * POST /users/auth/logout/ - invalidates the given refresh token
 * server-side. Callers (see `useLogout`) should clear the local session
 * regardless of whether this call actually succeeds - a failed logout
 * request (offline, already-expired token, ...) should never trap the user
 * client-side.
 */
export const logoutApi = async ({
  refresh_token,
}: LogoutRequest): Promise<void> => {
  await api.post(API_CONFIG.AUTH.LOGOUT, { refresh_token });
};
