import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { updateAddressApi } from '../api/addressesApi';
import type { AddressUpdateInput } from '../types/address.types';

/** PATCH /api/v1/users/me/addresses/{id}/. Invalidates the shared address
 * list query on success so every screen reading it refreshes together. */
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: AddressUpdateInput }) =>
      updateAddressApi(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADDRESSES.all });
    },
  });
};
