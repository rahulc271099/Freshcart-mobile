import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { listOrdersApi, type OrderSummaryApi } from '../api/ordersApi';

/** The shopper's order history. `usePlaceOrder` invalidates
 * `QUERY_KEYS.ORDERS.all`, so a just-placed order shows up on next view. */
export const useOrders = () =>
  useQuery<OrderSummaryApi[], Error>({
    queryKey: QUERY_KEYS.ORDERS.list(),
    queryFn: listOrdersApi,
  });
