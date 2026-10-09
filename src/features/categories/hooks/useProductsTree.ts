import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { getProductsTreeApi, type ProductTreeItem } from '../api/categoriesApi';

/**
 * GET /api/v1/catalogue/products/tree/
 *
 * Response shape is confirmed (see `ProductTreeItem`) but not yet wired
 * into the Category screen's UI - this hook exists so the real payload can
 * be inspected first, before building the product grid off of it.
 */
export const useProductsTree = () => {
  return useQuery<ProductTreeItem[], Error>({
    queryKey: QUERY_KEYS.PRODUCTS.tree(),
    queryFn: getProductsTreeApi,
  });
};
