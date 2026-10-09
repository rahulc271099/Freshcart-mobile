import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { deleteAddressApi } from '../api/addressesApi';

/** DELETE /api/v1/users/me/addresses/{id}/. Invalidates the shared address
 * list query on success so every screen reading it refreshes together. */
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAddressApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES.all });
    },
  });
};
