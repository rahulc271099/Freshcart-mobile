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
  /**
   * Sets an item's quantity exactly (used by the cart screen's +/- stepper,
   * which already knows the next value it wants rather than a delta).
   * `quantity <= 0` removes the item, same as tapping "-" down to zero.
   */
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

// TODO(cart): demo seed data so the cart screen has something to show out
// of the box (matching the "My Cart" reference UI) - same spirit as
// HomeScreen/CategoriesScreen shipping hardcoded dummy products. Remove
// once there's a real "recently added"/persisted-from-backend cart. These
// ids must exist in `features/cart/data/catalog.ts`'s CART_CATALOG.
const DEMO_SEED_ITEMS: CartItem[] = [
  { productId: 'grapes', quantity: 1 },
  { productId: 'potato-kizhangu', quantity: 1 },
  { productId: 'apple', quantity: 1 },
];

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: DEMO_SEED_ITEMS,
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
        set({
          items: get().items.filter(item => item.productId !== productId),
        }),
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          set({
            items: get().items.filter(item => item.productId !== productId),
          });
          return;
        }
        set({
          items: get().items.map(item =>
            item.productId === productId ? { ...item, quantity } : item,
          ),
        });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'freshcart-cart',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
