import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';
import type { DeliveryArea } from '@/features/location/types/location.types';
import type { PlaceOrderInput, PlacedOrder } from '../types/checkout.types';

/**
 * POST /api/customer/addresses/{id}/select/ - makes a saved address the
 * active delivery address server-side (also sets its delivery area), so
 * the cart's fee / minimum-order quote is computed for THIS address.
 * Fails with a coded 400 (`OUTSIDE_DELIVERY_AREA`, `DELIVERY_UNAVAILABLE`,
 * ...) when the address can't be served.
 */
export const selectAddressApi = async (
  addressId: number,
): Promise<DeliveryArea | null> => {
  const response = await api.post<{ selectedDeliveryArea?: DeliveryArea | null }>(
    API_CONFIG.DELIVERY.SELECT_ADDRESS(addressId),
  );
  return response.data.selectedDeliveryArea ?? null;
};

/**
 * POST /api/v1/orders/ - converts the caller's current server cart into a
 * real order (see `core/api/v1/orders/views.py`'s `OrderListView.post` -
 * "a new cart is created lazily on the next cart access"). This does NOT
 * send cart line items itself - only delivery details - the backend reads
 * whatever's already in the authenticated user's server-side cart.
 */
export const placeOrderApi = async (
  input: PlaceOrderInput,
): Promise<PlacedOrder> => {
  console.log('[checkoutApi] placeOrderApi -> request:', input);
  try {
    const response = await api.post<PlacedOrder>(API_CONFIG.ORDERS.CREATE, input);
    console.log('[checkoutApi] placeOrderApi <- response:', response.data);
    return response.data;
  } catch (error) {
    console.log('[checkoutApi] placeOrderApi <- error:', error);
    throw error;
  }
};
