import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { saveTokens } from '@/services/storage/mmkv';

import { loginUserApi, type LoginUserResponse } from '../api/authApi';

interface LoginVariables {
  mobile: string;
}

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginUserResponse, Error, LoginVariables>({
    mutationFn: ({ mobile }) => loginUserApi({ mobile }),

    onSuccess: data => {
      // TODO: update once the real response shape is confirmed.
      // The backend may return tokens here directly (password-less OTP
      // flows sometimes do a two-step: login → OTP → token), so for now
      // we guard and only save when the fields are present.
      const accessToken = (data as Record<string, unknown>)?.accessToken as
        | string
        | undefined;
      const refreshToken = (data as Record<string, unknown>)?.refreshToken as
        | string
        | undefined;

      if (accessToken && refreshToken) {
        saveTokens({ accessToken, refreshToken });
      }

      // Invalidate profile so it's re-fetched with the new session.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.profile() });
    },
  });
};
