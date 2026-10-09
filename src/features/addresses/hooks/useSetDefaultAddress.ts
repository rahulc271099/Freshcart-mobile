import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { setDefaultAddressApi } from '../api/addressesApi';

/** PATCH /api/v1/users/me/addresses/{id}/default/. Invalidates the shared
 * address list query on success so every screen reading it refreshes
 * together (another address's `is_default` flips to false server-side). */
export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setDefaultAddressApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES.all });
    },
  });
};
