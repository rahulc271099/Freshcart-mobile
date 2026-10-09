import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { getCartOffersApi } from '../api/offersApi';

/**
 * GET /api/v1/offers/?scope=CART, pre-filtered to CART-scope offers - see
 * `getCartOffersApi`'s comment for why the filtering is client-side.
 * Public endpoint (no auth required), so this can run as soon as the Cart
 * screen mounts.
 */
export const useCartOffers = () => {
  return useQuery({
    queryKey: QUERY_KEYS.OFFERS.cart(),
    queryFn: getCartOffersApi,
  });
};
