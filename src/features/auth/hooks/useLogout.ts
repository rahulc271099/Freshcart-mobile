import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearTokens, getTokens } from '@/services/storage/mmkv';
import { useAuthStore } from '@/store/authStore';

import { logoutApi } from '../api/authApi';

/**
 * Mutation hook for logging out (POST /users/auth/logout/).
 *
 * The local session is cleared in `onSettled` - i.e. whether the network
 * call succeeds, fails, or there's no connectivity at all - because a
 * logout request failing server-side is never a reason to leave the user
 * stuck signed in on their own device. `RootNavigator` reacts to
 * `authStore.isAuthenticated` flipping to `false` automatically, so no
 * navigation call is needed here.
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore(state => state.clearSession);

  return useMutation<void, Error, void>({
    mutationFn: () => {
      const tokens = getTokens();
      if (!tokens) return Promise.resolve();
      return logoutApi({ refresh_token: tokens.refreshToken });
    },
    onSettled: () => {
      clearTokens();
      clearSession();
      // Drop all cached server state - the next signed-in user (or this
      // same user signing back in) should never see a stale cache.
      queryClient.clear();
    },
  });
};
