import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { getProductDetailApi } from '../api/productApi';

/**
 * GET /api/v1/catalogue/customer/products/{id}/
 *
 * Powers Product Details for a REAL catalogue product (a numeric id from
 * Categories/Search) - `enabled` gates this off for a dummy/legacy
 * product (a non-numeric id like Home's `'grapes'`), which has no live
 * catalogue row to fetch and reads from `features/home/data/products.ts`
 * instead. See `ProductDetailsScreen`'s own comment on how it picks
 * between the two.
 */
export const useProductDetail = (productId: number, enabled: boolean) => {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.customerDetail(String(productId)),
    queryFn: () => getProductDetailApi(productId),
    enabled,
  });
};
