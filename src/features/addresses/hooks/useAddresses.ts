import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { listAddressesApi } from '../api/addressesApi';

/**
 * GET /api/v1/users/me/addresses/ - the account's saved address book.
 * Shared via TanStack Query's cache (keyed by `QUERY_KEYS.ADDRESSES.all`)
 * across every screen that reads addresses (AddressesScreen,
 * ConfirmLocationScreen, PaymentScreen) so there's one in-flight request
 * and one cache entry, not three separate copies - every create/update/
 * delete/set-default mutation invalidates this same key on success (see
 * the other hooks in this folder) so all three screens refresh together.
 */
export const useAddresses = () =>
  useQuery({
    queryKey: QUERY_KEYS.ADDRESSES.all,
    queryFn: listAddressesApi,
  });
