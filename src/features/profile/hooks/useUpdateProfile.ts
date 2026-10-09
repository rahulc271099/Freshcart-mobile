import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { useProfileStore } from '@/store/profileStore';

import {
  updateProfileApi,
  type UpdateProfilePayload,
  type MyProfile,
} from '../api/profileApi';

/**
 * PATCH /api/v1/users/me/ - { first_name, last_name }. (Previously pointed
 * at /users/me/profile/, the EXTENDED-profile endpoint - fixed in
 * `profileApi.ts`, see that file's comment.)
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

  return useMutation<MyProfile, Error, UpdateProfilePayload>({
    mutationFn: payload => updateProfileApi(payload),
    onSettled: (_data, _error, variables) => {
      updateProfile(variables);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.profile() });
    },
  });
};
