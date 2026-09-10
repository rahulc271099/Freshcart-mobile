import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';
import type { Address, AddressInput } from '../types/address.types';

export const listAddressesApi = async (): Promise<Address[]> => {
  const response = await api.get<Address[]>(API_CONFIG.ADDRESSES.LIST);
  return response.data;
};

export const createAddressApi = async (
  input: AddressInput,
): Promise<Address> => {
  const response = await api.post<Address>(API_CONFIG.ADDRESSES.CREATE, input);
  return response.data;
};

export const updateAddressApi = async (
  id: string,
  patch: Partial<AddressInput>,
): Promise<Address> => {
  const response = await api.patch<Address>(
    API_CONFIG.ADDRESSES.UPDATE(id),
    patch,
  );
  return response.data;
};

export const deleteAddressApi = async (id: string): Promise<void> => {
  await api.delete(API_CONFIG.ADDRESSES.DELETE(id));
};

export const setDefaultAddressApi = async (id: string): Promise<Address> => {
  const response = await api.patch<Address>(
    API_CONFIG.ADDRESSES.SET_DEFAULT(id),
  );
  return response.data;
};
