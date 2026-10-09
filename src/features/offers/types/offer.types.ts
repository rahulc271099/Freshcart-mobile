/**
 * Matches `core/api/v1/offers/serializers.py`'s `OfferSerializer` exactly
 * - field names stay snake_case on purpose (this endpoint, unlike
 * catalogue/orders/users, returns the DRF serializer's raw field names
 * as-is - there's no camelCase conversion anywhere in the offers app).
 *
 * Money-shaped fields (`min_order_amount`, `discount_value` when not
 * PERCENT, `max_discount_amount`) are still auto-denormalized to real
 * numbers by the shared axios interceptor (`services/api/moneyFields.ts`
 * strips underscores before matching its key list, so snake_case works
 * the same as camelCase there). `min_order_qty` is NOT in that money-key
 * list (it's a quantity, not currency) and DRF's `DecimalField` always
 * serializes as a string, so it stays a string here - parse it only if a
 * screen ever needs it as a number.
 */

export type OfferType =
  | 'FLAT_OFF'
  | 'PERCENT_OFF'
  | 'FREE_DELIVERY'
  | 'FIXED_PRICE'
  | 'QUANTITY_BREAK'
  | 'BUY_X_GET_Y'
  | 'BUNDLE';

export type OfferScope = 'PRODUCT' | 'VARIANT' | 'CATEGORY' | 'CART';

export type OfferDiscountType = 'FLAT' | 'PERCENT' | 'FIXED_PRICE' | null;

export interface CartOffer {
  offer_id: number;
  title: string;
  description: string | null;
  offer_type: OfferType;
  scope: OfferScope;
  min_order_amount: number | null;
  can_stack: boolean;
  discount_type: OfferDiscountType;
  discount_value: number | null;
  /** Decimal string (e.g. "2.000"), NOT auto-converted to a number - see
   * file header comment. */
  min_order_qty: string | null;
  max_discount_amount: number | null;
  label: string | null;
  banner_image_url: string | null;
  display_order: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  created_by: number | null;
  updated_by: number | null;
}
