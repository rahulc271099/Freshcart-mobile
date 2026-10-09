/**
 * Display data for one purchasable product, independent of how many of it
 * (if any) are in the cart - see `CartLine` below for that joined shape.
 */
export interface CartLineItem {
  id: string;
  /** The catalogue product this line is for - lets `CartItemRow`'s
   * "Change qty" link reopen `ProductDetailsScreen`'s own options sheet
   * for the exact same product, rather than re-implementing a second
   * picker inline in the cart. */
  productId: string;
  name: string;
  imageUri: string;
  /** Selling price for the item's unit, after any per-item discount. For
   * a custom-quantity (loose/bulk) line this is the TOTAL for the whole
   * `unit` already (see `apiBaseQty`'s own comment), not a per-root-unit
   * rate. */
  price: number;
  /** MRP for the same unit, before discount. */
  originalPrice: number;
  unitPrice?: number;
  finalUnitPrice?: number;
  /** Display unit label, e.g. "500 g", "1 kg", "4 pcs" - for a real
   * pack-size variant this is ONE pack's size; for a custom-quantity line
   * it's the chosen TOTAL weight (e.g. "3 kg"), not a per-pack size. */
  unit: string;
  /** Custom-quantity lines only - mirrors `cartStore.ts`'s
   * `CartItem.apiBaseQty`: the real root-unit amount `unit`/`price`
   * already represent (e.g. `3` for "3 kg"). `undefined` for a real
   * pack-size variant, where `quantity` already counts whole packs and
   * there's no separate per-unit rate to derive. */
  apiBaseQty?: number;
  /** Custom-quantity lines only - mirrors `cartStore.ts`'s
   * `CartItem.quantityRule`: the backend's own min/max/step rule,
   * snapshotted at add-time so the cart row's own stepper can step
   * `apiBaseQty` by this product's real `stepQty` without a network
   * call. `undefined` for a real pack-size variant, or for an orphan
   * line reconciled from another device (see `cartStore.ts`'s
   * `hydrateFromServer`). */
  quantityRule?: { minQty: number; maxQty: number; stepQty: number };
  /** Custom-quantity lines only - mirrors `cartStore.ts`'s
   * `CartItem.pricingUnitLabel`: the short unit code `apiBaseQty` is
   * measured in (e.g. "kg"), so the row can relabel itself (e.g.
   * "3 kg" -> "3.25 kg") after the stepper changes the amount. */
  pricingUnitLabel?: string;
}

/** A catalog product joined with its quantity from `useCartStore`. */
export interface CartLine extends CartLineItem {
  quantity: number;
}
