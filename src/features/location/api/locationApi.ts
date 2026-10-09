import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';
import type {
  CheckPincodeResponse,
  DeliveryArea,
} from '../types/location.types';

/**
 * POST /api/customer/delivery/check-pincode/ (public). An unserviceable
 * pincode is a normal 200 with `deliveryAvailable: false`; only a
 * malformed pincode is an error (400).
 */
export const checkPincodeApi = async (
  pincode: string,
): Promise<CheckPincodeResponse> => {
  const response = await api.post<CheckPincodeResponse>(
    API_CONFIG.DELIVERY.CHECK_PINCODE,
    { pincode },
  );
  return response.data;
};

/**
 * POST /api/customer/delivery/select-area/ (auth). Saves the choice on the
 * shopper's profile - the cart's delivery quote reads it server-side.
 */
export const selectDeliveryAreaApi = async (input: {
  deliveryAreaId: number;
  pincode: string;
}): Promise<DeliveryArea> => {
  const response = await api.post<{ selectedDeliveryArea: DeliveryArea }>(
    API_CONFIG.DELIVERY.SELECT_AREA,
    input,
  );
  console.log('[location] select-area response', response.data);
  return response.data.selectedDeliveryArea;
};

/**
 * GET /api/customer/delivery/selected-area/ (auth). `null` means nothing
 * is saved yet OR the saved one is no longer serviceable - either way the
 * shopper has to choose again.
 */
export const getSelectedDeliveryAreaApi =
  async (): Promise<DeliveryArea | null> => {
    const response = await api.get<{
      selectedDeliveryArea: DeliveryArea | null;
    }>(API_CONFIG.DELIVERY.SELECTED_AREA);
    return response.data.selectedDeliveryArea ?? null;
  };
