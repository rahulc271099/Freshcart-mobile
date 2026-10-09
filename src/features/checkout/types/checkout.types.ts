/**
 * Request/response shapes for `POST /api/v1/orders/` - matches
 * `core/api/v1/orders/serializers.py`'s `PlaceOrderSerializer`/
 * `OrderSerializer` (snake_case, same as `features/cart/api/cartApi.ts` -
 * the orders app's renderer doesn't camelCase - see that file's own
 * comment).
 */

/**
 * The order is placed against a SAVED address by id. The server derives
 * the delivery area, fee, minimum-order check, discounts and total from
 * that address + the server cart itself - the client deliberately sends
 * NO money fields (`delivery_fee`, `tax_amount`, ...): the backend
 * ignores them as untrusted, and sending stale ones only invites drift.
 */
export type PlaceOrderInput = {
  delivery_address_id: number;
  coupon_code?: string;
  remarks?: string;
};

/** Loose on purpose, same spirit as `CustomerOfferDetail` (see
 * `features/product/api/productApi.ts`) - only the fields this app
 * actually reads are named; the rest of `OrderSerializer`'s fields pass
 * through via the index signature. Money fields arrive already converted
 * to numbers by `denormalizeMoney`. */
export type PlacedOrder = {
  order_id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  placed_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

/** Only payment method actually available today - no online gateway is
 * wired up anywhere in `core/api/v1/orders`, so this is deliberately a
 * 1-item union rather than a guessed-at list of methods the backend
 * can't actually process yet. */
export type PaymentMethod = 'COD';
