/**
 * Display data for one purchasable product, independent of how many of it
 * (if any) are in the cart - see `CartLine` below for that joined shape.
 */
export interface CartLineItem {
  id: string;
  name: string;
  imageUri: string;
  /** Selling price for the item's unit, after any per-item discount. */
  price: number;
  /** MRP for the same unit, before discount. */
  originalPrice: number;
  /** Display unit label, e.g. "500 g", "1 kg", "4 pcs". */
  unit: string;
}

/** A catalog product joined with its quantity from `useCartStore`. */
export interface CartLine extends CartLineItem {
  quantity: number;
}
