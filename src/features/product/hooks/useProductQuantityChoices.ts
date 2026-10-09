import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { getProductQuantityChoicesApi } from '../api/productApi';

/**
 * GET /api/v1/catalogue/customer/products/{id}/quantity-choices/
 *
 * Lazy by design - `enabled` gates this on the options sheet actually
 * being open, so a shopper who never taps "Options" never triggers it.
 * Only call this for a product `resolveOptionsMode()` routes here - see
 * that function's own comment for why the backend rejects the wrong one.
 */
export const useProductQuantityChoices = (
  productId: number,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.quantityChoices(String(productId)),
    queryFn: () => getProductQuantityChoicesApi(productId),
    enabled,
  });
};
