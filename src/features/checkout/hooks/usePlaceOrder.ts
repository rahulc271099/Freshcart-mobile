import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { placeOrderApi } from '../api/checkoutApi';
import type { PlaceOrderInput, PlacedOrder } from '../types/checkout.types';

/**
 * Mutation hook for `POST /api/v1/orders/`. Invalidates the orders-list
 * query key on success so an Orders/History screen (not built yet) picks
 * up the new order next time it mounts, same pattern as `useVerifyOtp`'s
 * profile-query invalidation. Clearing the cart and navigating away on
 * success is `PaymentScreen`'s job, not this hook's - keeps this a pure
 * server-state concern, same rule `useVerifyOtp`'s own comment documents.
 */
export const usePlaceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<PlacedOrder, Error, PlaceOrderInput>({
    mutationFn: placeOrderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.all });
      // The server converted the cart - any cached cart view is stale.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.all });
    },
  });
};
