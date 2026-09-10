import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '../services/storage/mmkv';
import type {
  Address,
  AddressInput,
} from '../features/addresses/types/address.types';

/**
 * Local, MMKV-persisted address book - drives AddressesScreen/
 * AddEditAddressScreen today. Field names deliberately match the confirmed
 * API contract (see `address.types.ts`) so swapping this for the real
 * `features/addresses/api/addressesApi.ts` + TanStack Query later is a
 * store-call swap, not a data-shape migration.
 */
type AddressState = {
  addresses: Address[];
  addAddress: (input: AddressInput) => void;
  updateAddress: (id: string, patch: Partial<AddressInput>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
};

// TODO(addresses): demo seed data, same spirit as cartStore's
// DEMO_SEED_ITEMS - remove once addresses load from the real API.
const DEMO_SEED_ADDRESSES: Address[] = [
  {
    id: 'addr-home',
    label: 'Home',
    address_line_1: '221B Baker Street',
    address_line_2: 'Near Regent’s Park',
    city: 'London',
    state: 'Greater London',
    pincode: 'NW1 6XE',
    is_default: true,
  },
  {
    id: 'addr-work',
    label: 'Work',
    address_line_1: '10 Downing Street',
    city: 'London',
    state: 'Greater London',
    pincode: 'SW1A 2AA',
    is_default: false,
  },
];

let nextId = DEMO_SEED_ADDRESSES.length + 1;

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: DEMO_SEED_ADDRESSES,
      addAddress: input => {
        const isFirst = get().addresses.length === 0;
        const address: Address = {
          ...input,
          id: `addr-${nextId++}`,
          // The very first address a user adds becomes their default
          // automatically - there's no meaningful "non-default" state
          // with zero addresses on file.
          is_default: isFirst,
        };
        set({ addresses: [...get().addresses, address] });
      },
      updateAddress: (id, patch) =>
        set({
          addresses: get().addresses.map(a =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        }),
      removeAddress: id => {
        const remaining = get().addresses.filter(a => a.id !== id);
        const removedWasDefault = get().addresses.find(
          a => a.id === id,
        )?.is_default;
        // If the default address was just removed, promote whichever one
        // is left first rather than leaving the book with no default.
        if (removedWasDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], is_default: true };
        }
        set({ addresses: remaining });
      },
      setDefaultAddress: id =>
        set({
          addresses: get().addresses.map(a => ({
            ...a,
            is_default: a.id === id,
          })),
        }),
    }),
    {
      name: 'freshcart-addresses',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
