import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { useProfileStore } from '@/store/profileStore';

import {
  updateProfileApi,
  type UpdateProfilePayload,
  type UserProfile,
} from '../api/profileApi';

/**
 * PATCH /api/v1/users/me/profile/ - { first_name, last_name }.
 *
 * Same best-effort pattern as `useLogout`: the local `profileStore` is
 * always updated in `onSettled`, regardless of whether the network call
 * actually succeeded - there's no live backend to hit yet, so a failure
 * here is the expected case, not an exceptional one. Once a real backend
 * exists this keeps working unchanged; `onSettled` just starts actually
 * succeeding instead of always falling through to it.
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateProfile = useProfileStore(state => state.updateProfile);

  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: payload => updateProfileApi(payload),
    onSettled: (_data, _error, variables) => {
      updateProfile(variables);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.profile() });
    },
  });
};
