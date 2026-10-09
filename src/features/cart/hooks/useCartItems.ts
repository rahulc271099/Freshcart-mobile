import { useMemo } from 'react';

import { useCartStore } from '@/store/cartStore';
import type { CartLine } from '../types/cart.types';

/** Local-only fallback, used ONLY before the very first server cart
 * response has arrived (cold start, or every sync so far has failed) -
 * once `cartStore.serverCart` is populated, the real `effective_delivery_fee`
 * from the backend is used instead. See `useCartItems`'s own comment. */
const FALLBACK_DELIVERY_CHARGE = 20;

/** One offer the backend actually applied to this cart - straight from
 * `CartViewApi.applied_cart_offers`, nothing recomputed. */
export interface AppliedOffer {
  offerId: number;
  offerType: string;
  title: string;
  discountAmount: number;
}

export interface CartTotals {
  /** Sum of each line's MRP × quantity. Backend-sourced (from each real
   * cart item's `base_price`/`quantity`) once `serverCart` has loaded. */
  totalMrp: number;
  /** How much the per-item discounts saved - `totalMrp - itemsTotal` when
   * backend-sourced (product_discount's own components), or the same
   * local-only diff before the first sync. */
  discount: number;
  /** Sum of each line's selling price × quantity (before delivery) - kept
   * local/optimistic always, since this also drives on-screen progress
   * bars (Maxxsaver) that need to update the instant a shopper taps
   * "Add", not after a network round trip. */
  itemsTotal: number;
  /** What delivery actually costs right now - the backend's
   * `effective_delivery_fee` once available (already reflects any
   * FREE_DELIVERY-type offer), otherwise the local placeholder. */
  deliveryCharge: number;
  /** The base delivery fee before any offer - only differs from
   * `deliveryCharge` when `deliveryDiscount > 0`, which is when the UI
   * should show it struck through. */
  deliveryFee: number;
  deliveryDiscount: number;
  /** The real final payable amount - the backend's own `grand_total` once
   * available, never a client-side re-sum of it. */
  toPay: number;
  /** Every CART-scope offer the backend applied, excluding FREE_DELIVERY
   * (that one's already reflected via `deliveryFee`/`deliveryCharge`
   * above - showing it again here would double it up). Empty until the
   * first server cart response arrives. */
  appliedOffers: AppliedOffer[];
  /** False until `cartStore.serverCart` has loaded at least once - lets a
   * caller tell a real backend-computed total apart from the local
   * placeholder shown immediately after an optimistic add, before that
   * add's sync call has resolved. */
  isBackendSourced: boolean;
  /** Smallest item subtotal the shopper's delivery area accepts, or
   * `null` when unknown (no area yet / not synced). */
  minimumOrderAmount: number | null;
  /** How much more the cart needs to reach `minimumOrderAmount` (0 when
   * met or unknown) - drives the "Add ₹X more" gate on Checkout. */
  minimumOrderShortfall: number;
  /** Server-reported delivery ETA in minutes, when known. */
  estimatedDeliveryMinutes: number | null;
}

/** Parses a money-ish value (number or numeric string) into a finite
 * number, `null` for anything else. */
function toMoney(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Reads `useCartStore`'s lines directly - each `CartItem` already carries
 * its own display data (name/image/price/unit), captured at add-time from
 * the real catalogue product/variant (see `cartStore.ts`'s own comment),
 * so there's no separate catalog lookup/join to fail here. Centralized in
 * one hook (rather than recomputed per-screen) so Cart and Categories'
 * `CartBar` always agree on the same numbers.
 *
 * `totals` prefers `cartStore.serverCart` (the real `GET/POST/PATCH/DELETE
 * .../orders/cart/...` response from whichever sync call last succeeded)
 * for every money-shaped figure - subtotal, delivery fee, discounts, grand
 * total, applied offers - rather than recomputing a shadow version of the
 * backend's own discount/delivery engine client-side. It only falls back
 * to a local, item-only computation before that first server response has
 * arrived (cold start with no sync yet, or every sync attempt failed),
 * so the Cart screen still renders something sensible rather than blank.
 */
export function useCartItems() {
  const items = useCartStore(state => state.items);
  const serverCart = useCartStore(state => state.serverCart);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const updateCustomQuantityAmount = useCartStore(
    state => state.updateCustomQuantityAmount,
  );
  const removeItem = useCartStore(state => state.removeItem);
  const clearCart = useCartStore(state => state.clearCart);

  const lines = useMemo<CartLine[]>(
    () =>
      items.map(item => {
        const serverItem = serverCart?.items?.find(i => i.cart_item_id === item.serverCartItemId);
        
        return {
          id: item.id,
          productId: item.productId,
          name: serverItem?.variant_name ?? item.name,
          imageUri: item.imageUri,
          price: item.price,
          originalPrice: item.originalPrice ?? item.price,
          unitPrice: serverItem?.unit_price ? Number(serverItem.unit_price) : undefined,
          finalUnitPrice: serverItem?.final_unit_price ? Number(serverItem.final_unit_price) : undefined,
          unit: item.unit,
          apiBaseQty: item.apiBaseQty,
          quantityRule: item.quantityRule,
          pricingUnitLabel: item.pricingUnitLabel,
          quantity: item.quantity,
        };
      }),
    [items, serverCart],
  );

  const totals = useMemo<CartTotals>(() => {
    const itemsTotal = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );

    if (serverCart) {
      // Both `product_discount` and `items_subtotal` are real top-level
      // fields the backend already computed (`cart_service.py`'s own
      // `product_discount=sum(item.discount_amount for item in items)`) -
      // `totalMrp` is just their sum, never a frontend-derived discount.
      // This USED to sum each item's `base_price` client-side and
      // subtract `items_subtotal` from that instead, which could disagree
      // with the backend's own `product_discount` (a real line-item
      // discount is a different thing from `base_price` simply being
      // higher than `unit_price` - that gap isn't necessarily a tracked
      // "discount" on the backend's own terms) - this reads the
      // backend's number directly instead of re-deriving a different one.
      const totalMrp = serverCart.items_subtotal + serverCart.product_discount;
      const deliveryFee = serverCart.delivery_fee ?? 0;
      const deliveryDiscount = serverCart.delivery_discount ?? 0;
      const deliveryCharge = serverCart.effective_delivery_fee ?? deliveryFee;
      const appliedOffers = (serverCart.applied_cart_offers ?? [])
        // FREE_DELIVERY is already reflected in deliveryFee/deliveryCharge
        // above - listing it again here would double-count the same
        // discount in two places on screen.
        .filter(offer => offer.offer_type !== 'FREE_DELIVERY')
        .map(offer => ({
          offerId: offer.offer_id,
          offerType: offer.offer_type,
          title: offer.title,
          discountAmount: offer.discount_amount,
        }));

      const minimumOrderAmount = toMoney(
        serverCart.minimumOrderAmount ??
          serverCart.deliveryArea?.minimumOrderAmount,
      );
      const serverSubtotal = Number(serverCart.items_subtotal) || 0;
      return {
        totalMrp,
        discount: serverCart.product_discount,
        itemsTotal,
        deliveryCharge,
        deliveryFee,
        deliveryDiscount,
        toPay: serverCart.grand_total ?? serverCart.items_subtotal + deliveryCharge,
        appliedOffers,
        isBackendSourced: true,
        minimumOrderAmount,
        minimumOrderShortfall:
          minimumOrderAmount != null
            ? Math.max(minimumOrderAmount - serverSubtotal, 0)
            : 0,
        estimatedDeliveryMinutes:
          toMoney(
            serverCart.estimatedDeliveryMinutes ??
              serverCart.deliveryArea?.estimatedDeliveryMinutes,
          ),
      };
    }

    // No server cart yet - nothing backend-sourced to show a discount
    // against, so this shows NONE rather than a guessed figure (see this
    // function's own top comment - every money figure here should prefer
    // the real server cart; this fallback is for before that first
    // response has arrived at all).
    const deliveryCharge = lines.length > 0 ? FALLBACK_DELIVERY_CHARGE : 0;
    return {
      totalMrp: itemsTotal,
      discount: 0,
      itemsTotal,
      deliveryCharge,
      deliveryFee: deliveryCharge,
      deliveryDiscount: 0,
      toPay: itemsTotal + deliveryCharge,
      appliedOffers: [],
      isBackendSourced: false,
      minimumOrderAmount: null,
      minimumOrderShortfall: 0,
      estimatedDeliveryMinutes: null,
    };
  }, [lines, serverCart]);

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );

  return {
    lines,
    totals,
    itemCount,
    updateQuantity,
    updateCustomQuantityAmount,
    removeItem,
    clearCart,
  };
}
