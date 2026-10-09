import { create } from 'zustand';

/**
 * Checkout-scoped UI state - which saved address (from the real
 * `/users/me/addresses/` API, via `useAddresses`) is currently chosen for
 * THIS checkout flow. Deliberately NOT persisted (unlike `cartStore`) and
 * NOT the same thing as an address's own `is_default` flag - picking a
 * different address just for one order shouldn't silently change the
 * account's default address. Reset is implicit: `ConfirmLocationScreen`'s
 * own seeding effect re-derives a sensible default again any time this is
 * empty/stale (e.g. the previously-selected address was deleted).
 */
type CheckoutState = {
  selectedAddressId: number | null;
  setSelectedAddressId: (id: number | null) => void;
};

export const useCheckoutStore = create<CheckoutState>()(set => ({
  selectedAddressId: null,
  setSelectedAddressId: id => set({ selectedAddressId: id }),
}));
