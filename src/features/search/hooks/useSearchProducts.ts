import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';

import { searchCustomerProductsApi } from '../api/searchApi';
import { useDebouncedValue } from './useDebouncedValue';

// The Render.com free-tier backend cold-starts after ~15 min idle (30-60s
// wake-up) - not something Search can hide, but a longer debounce at
// least avoids firing a fresh request on every keystroke while the
// shopper is still typing, which would otherwise queue up a burst of
// slow requests against a possibly-still-waking server.
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Debounced, server-side search against the same `customer/products/`
 * listing endpoint Categories uses (see `searchApi.ts` for why there's no
 * separate search endpoint) - `enabled` only fires once the trimmed,
 * debounced query is non-empty, so clearing the search box doesn't leave
 * a stale request in flight or a stale result on screen.
 */
export const useSearchProducts = (query: string) => {
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);

  const searchQuery = useQuery({
    queryKey: QUERY_KEYS.SEARCH.products(debouncedQuery),
    queryFn: () => searchCustomerProductsApi({ query: debouncedQuery }),
    enabled: debouncedQuery.length > 0,
  });

  return {
    ...searchQuery,
    /** True while the debounce timer is still pending, i.e. before the
     * query has even started - distinct from `isLoading`, which only
     * covers the network request itself. The screen uses this to show a
     * "searching..." state immediately on keystroke rather than a beat of
     * nothing while the debounce settles. */
    isDebouncing: query.trim() !== debouncedQuery && query.trim().length > 0,
  };
};
