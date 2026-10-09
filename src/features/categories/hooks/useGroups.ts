import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { getGroupsApi, type CatalogueGroup } from '../api/categoriesApi';

/**
 * GET /api/v1/catalogue/groups/
 *
 * Flat endpoint - returns every group across every category in one call.
 */
export const useGroups = () => {
  return useQuery<CatalogueGroup[], Error>({
    queryKey: QUERY_KEYS.GROUPS.list(),
    queryFn: getGroupsApi,
  });
};
