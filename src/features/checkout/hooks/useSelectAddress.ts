import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { useCartStore } from '@/store/cartStore';
import type { DeliveryArea } from '@/features/location/types/location.types';
import { selectAddressApi } from '../api/checkoutApi';

/**
 * Pins a saved address as the active delivery address on the server, then
 * refreshes everything priced off it: the saved-area query (header label)
 * and the cart (delivery fee + minimum order are quoted per area, so
 * switching address can change both).
 */
export const useSelectAddress = () => {
  const queryClient = useQueryClient();

  return useMutation<DeliveryArea | null, Error, number>({
    mutationFn: selectAddressApi,
    onSuccess: area => {
      if (area) {
        queryClient.setQueryData(QUERY_KEYS.DELIVERY.selected(), area);
      } else {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.DELIVERY.selected(),
        });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.all });
      // Re-read the server cart so the quote reflects the new area.
      useCartStore.getState().hydrateFromServer();
    },
  });
};
