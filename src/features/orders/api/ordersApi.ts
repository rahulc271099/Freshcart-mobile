import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';

/**
 * One row of `GET /api/v1/orders/` - matches `OrderSerializer`. Money
 * fields are real numbers (the response interceptor's `denormalizeMoney`
 * converts them); only fields the Orders list reads are named.
 */
export type OrderSummaryApi = {
  order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_amount: number;
  delivery_area_name_snapshot: string | null;
  placed_at: string | null;
  created_at: string | null;
};

/** GET /api/v1/orders/ - the caller's own orders, newest first. */
export const listOrdersApi = async (): Promise<OrderSummaryApi[]> => {
  const response = await api.get<OrderSummaryApi[]>(API_CONFIG.ORDERS.LIST, {
    params: { limit: 50, offset: 0 },
  });
  return response.data;
};
