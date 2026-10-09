import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { getCustomerProductsApi } from '../api/categoriesApi';

/**
 * GET /api/v1/catalogue/customer/products/?group_id=&limit=&offset=
 *
 * Scoped to one group at a time - the Categories screen calls this with
 * whichever group is currently active, instead of fetching every group's
 * products in a single unscoped call (see `getProductsTreeApi`'s own
 * comment for why that was slow). `enabled: groupId != null` so this
 * doesn't fire before the sidebar has picked a default group yet.
 *
 * Deliberately NOT using `placeholderData: keepPreviousData` here - that
 * used to silently keep showing the PREVIOUS group's products (with
 * `isLoading` staying `false`) while a newly-selected group's page was
 * still loading, so switching groups looked instant but was actually
 * showing stale/wrong data for however long the fetch took. `groupId` is
 * part of this hook's own query key, so without a placeholder, `isLoading`
 * correctly reports `true` on every switch to a group that isn't already
 * cached - which is exactly what makes `CategoriesScreen`'s existing
 * skeleton branch show on every group switch, not just the very first
 * load.
 */
export const useCustomerProducts = (groupId: number | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.customerList(groupId),
    queryFn: () => getCustomerProductsApi({ groupId: groupId as number }),
    enabled: groupId != null,
  });
};
