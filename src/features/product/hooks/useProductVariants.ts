import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { getProductVariantsApi } from '../api/productApi';

/**
 * GET /api/v1/catalogue/customer/products/{id}/variants/
 *
 * Lazy by design - see `useProductQuantityChoices`'s own comment; this is
 * its counterpart for every product `resolveOptionsMode()` doesn't route
 * to quantity-choices.
 */
export const useProductVariants = (productId: number, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.variants(String(productId)),
    queryFn: () => getProductVariantsApi(productId),
    enabled,
  });
};
