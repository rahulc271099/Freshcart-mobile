import { useMemo } from 'react';

import { useCartStore } from '@/store/cartStore';
import { CART_CATALOG } from '../data/catalog';
import type { CartLine } from '../types/cart.types';

/** Flat delivery fee applied to every order. TODO: replace with real shipping/delivery-fee logic once that exists. */
export const DELIVERY_CHARGE = 20;

export interface CartTotals {
  /** Sum of each line's MRP × quantity. */
  totalMrp: number;
  /** `totalMrp - itemsTotal` - how much the per-item discounts saved. */
  discount: number;
  /** Sum of each line's selling price × quantity (before delivery). */
  itemsTotal: number;
  deliveryCharge: number;
  /** `itemsTotal + deliveryCharge` - the final payable amount. */
  toPay: number;
}

/**
 * Joins `useCartStore`'s `{ productId, quantity }[]` against `CART_CATALOG`
 * to get full line items, and derives the totals the cart screen (and
 * `CartBar` wherever else it's shown) needs. Centralized here rather than
 * recomputed per-screen so Cart and CategoriesScreen's `CartBar` always
 * agree on the same numbers.
 */
export function useCartItems() {
  const items = useCartStore(state => state.items);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const clearCart = useCartStore(state => state.clearCart);

  const lines = useMemo<CartLine[]>(() => {
    return items.reduce<CartLine[]>((acc, item) => {
      const product = CART_CATALOG[item.productId];
      // Fail soft on an unresolvable id rather than crash the cart screen -
      // shouldn't happen with the current catalog, but a store persisted
      // from an older app version could reference a since-removed product.
      if (!product) return acc;
      acc.push({ ...product, quantity: item.quantity });
      return acc;
    }, []);
  }, [items]);

  const totals = useMemo<CartTotals>(() => {
    const totalMrp = lines.reduce(
      (sum, line) => sum + line.originalPrice * line.quantity,
      0,
    );
    const itemsTotal = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );
    const deliveryCharge = lines.length > 0 ? DELIVERY_CHARGE : 0;
    return {
      totalMrp,
      discount: totalMrp - itemsTotal,
      itemsTotal,
      deliveryCharge,
      toPay: itemsTotal + deliveryCharge,
    };
  }, [lines]);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  return { lines, totals, itemCount, updateQuantity, removeItem, clearCart };
}
