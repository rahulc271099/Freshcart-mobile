import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '../services/storage/mmkv';

/**
 * Local cart state foundation only: which product ids are in the cart and
 * at what quantity. Deliberately no pricing, discount, tax or stock
 * business logic here — that belongs to `features/cart` once that feature
 * is actually built. This just proves the Zustand + MMKV persistence
 * wiring works end to end.
 */
export type CartItem = {
  productId: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (productId: string, quantity = 1) => {
        const existing = get().items.find(item => item.productId === productId);
        if (existing) {
          set({
            items: get().items.map(item =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            ),
          });
          return;
        }
        set({ items: [...get().items, { productId, quantity }] });
      },
      removeItem: (productId: string) =>
        set({ items: get().items.filter(item => item.productId !== productId) }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'freshcart-cart',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
