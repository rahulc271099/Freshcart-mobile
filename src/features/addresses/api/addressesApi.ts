import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';
import type { ApiEnvelope } from '@/services/api/types';
import type {
  Address,
  AddressInput,
  AddressUpdateInput,
} from '../types/address.types';

/**
 * GET /api/v1/users/me/addresses/ - wrapped in the standard `users`-app
 * envelope (`ApiEnvelope<T>` - see `services/api/types.ts`); `data` is the
 * plain address array.
 */
export const listAddressesApi = async (): Promise<Address[]> => {
  const response = await api.get<ApiEnvelope<Address[]>>(
    API_CONFIG.ADDRESSES.LIST,
  );
  return response.data.data;
};

export const createAddressApi = async (
  input: AddressInput,
): Promise<Address> => {
  const response = await api.post<ApiEnvelope<Address>>(
    API_CONFIG.ADDRESSES.CREATE,
    input,
  );
  console.log("🚀 ~ createAddressApi ~ response:", response)
  return response.data.data;
};

export const updateAddressApi = async (
  id: number,
  patch: AddressUpdateInput,
): Promise<Address> => {
  const response = await api.patch<ApiEnvelope<Address>>(
    API_CONFIG.ADDRESSES.UPDATE(id),
    patch,
  );
  return response.data.data;
};

export const deleteAddressApi = async (id: number): Promise<void> => {
  await api.delete(API_CONFIG.ADDRESSES.DELETE(id));
};

export const setDefaultAddressApi = async (id: number): Promise<Address> => {
  const response = await api.patch<ApiEnvelope<Address>>(
    API_CONFIG.ADDRESSES.SET_DEFAULT(id),
  );
  return response.data.data;
};
