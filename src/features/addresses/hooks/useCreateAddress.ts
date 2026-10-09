import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { createAddressApi } from '../api/addressesApi';

/** POST /api/v1/users/me/addresses/. Invalidates the shared address list
 * query on success so every screen reading it refreshes together. */
export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES.all });
    },
  });
};
