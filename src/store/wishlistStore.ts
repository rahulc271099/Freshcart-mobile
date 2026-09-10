import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '../services/storage/mmkv';

/**
 * Local wishlist state - which product ids the user has hearted. Same
 * minimal shape/persistence pattern as `cartStore.ts` (Zustand + MMKV,
 * productId-keyed). No pricing/availability logic here, same reasoning as
 * cartStore: that belongs to whatever screen renders the wishlist.
 */
type WishlistState = {
  productIds: string[];
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      isWishlisted: (productId: string) => get().productIds.includes(productId),
      toggle: (productId: string) => {
        const { productIds } = get();
        set({
          productIds: productIds.includes(productId)
            ? productIds.filter(id => id !== productId)
            : [...productIds, productId],
        });
      },
    }),
    {
      name: 'freshcart-wishlist',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
