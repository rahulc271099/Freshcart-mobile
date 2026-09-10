import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { saveTokens } from '@/services/storage/mmkv';
import { useAuthStore } from '@/store/authStore';

import {
  verifyOtpApi,
  type VerifyOtpRequest,
  type VerifyOtpResponse,
} from '../api/authApi';

/**
 * Mutation hook for OTP verification (POST /users/auth/otp/verify/).
 *
 * On success it:
 *  1. Persists the access + refresh tokens to MMKV (via `saveTokens`) so
 *     the Axios request interceptor can attach them immediately on the next
 *     request — synchronously, without waiting for Zustand to rehydrate.
 *  2. Updates the reactive `authStore` so `RootNavigator` switches to the
 *     authenticated stack without needing a navigation call.
 *  3. Invalidates the user profile query so it's re-fetched with the new
 *     session, exactly as `useLogin` does.
 *
 * The screen owns error display and OTP box error-state — `onError` should
 * be handled in the `mutate` call options rather than here, to keep this
 * hook a pure server-state concern.
 */
export const useVerifyOtp = () => {
  const queryClient = useQueryClient();
  const setSession = useAuthStore(state => state.setSession);

  return useMutation<VerifyOtpResponse, Error, VerifyOtpRequest>({
    mutationFn: ({ mobile, otp }) => verifyOtpApi({ mobile, otp }),

    onSuccess: data => {
      const { access_token, refresh_token } = data.data;

      // 1. Persist tokens for the Axios interceptor (synchronous MMKV read).
      saveTokens({ accessToken: access_token, refreshToken: refresh_token });

      // 2. Update Zustand so RootNavigator moves to the Main stack.
      setSession(access_token);

      // 3. Invalidate cached profile so it reloads under the new session.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.profile() });
    },
  });
};
