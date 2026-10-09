import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';

/**
 * GET/POST/PATCH/DELETE .../orders/cart/... - matches
 * `core/api/v1/orders/serializers.py` exactly. Unlike the catalogue
 * customer-facing endpoints (camelCase, hand-built dicts), the orders
 * app's `REST_FRAMEWORK` renderer is plain `JSONRenderer` with no
 * camelCase conversion (see `config/settings/base.py`), so these types
 * stay snake_case on purpose rather than being reshaped to match.
 */
export type CartItemApi = {
  cart_item_id: number;
  cart_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  unit_price: number; // For compatibility
  final_unit_price?: string; // from API
  original_unit_price?: string;
  variant_name?: string | null;
  base_price: number | null;
  discount_amount: number;
  line_total: number;
  offer_id: number | null;
  offer_type: string | null;
  is_component: boolean;
};

export type CartApi = {
  cart_id: number;
  user_id: number;
  status: string;
  currency_code: string;
  coupon_code: string | null;
  coupon_discount_amount: number;
};

/** One cart-level offer the backend actually applied (free delivery, a
 * cart-wide flat/percent discount, ...) - `offer_type` is one of the real
 * backend enum values (see core/domain/enums/offer_enums.py: FLAT_OFF,
 * PERCENT_OFF, FREE_DELIVERY, FIXED_PRICE, QUANTITY_BREAK, BUY_X_GET_Y,
 * BUNDLE), and `title`/`discount_amount` are already the backend's own
 * display text and computed amount - nothing here is re-derived
 * client-side. */
export type AppliedCartOfferApi = {
  offer_id: number;
  offer_type: string;
  title: string;
  discount_amount: number;
};

export type CartViewApi = {
  cart: CartApi;
  items: CartItemApi[];
  items_subtotal: number;
  items_count: number;
  /** Sum of every line's own item/variant-level discount (CartItemSerializer's
   * `discount_amount` fields, pre-applied into `unit_price`). */
  product_discount: number;
  /** Cart-wide (non-delivery) discount from an applied CART-scope offer. */
  cart_discount: number;
  coupon_discount: number;
  coupon_error: string | null;
  /** Every offer the backend actually applied to this cart right now -
   * see `AppliedCartOfferApi`'s own comment. */
  applied_cart_offers: AppliedCartOfferApi[];
  /** The real final payable amount - prefer this over any client-computed
   * total. */
  grand_total: number;
  /** Base delivery fee before any FREE_DELIVERY-type offer. */
  delivery_fee: number;
  delivery_discount: number;
  /** What delivery actually costs after `delivery_discount` - this is
   * what should be charged/shown as "Delivery Charges", with `delivery_fee`
   * struck through only when the two differ. */
  effective_delivery_fee: number;
  /** The delivery area the quote was computed for - `null` when the
   * shopper has no usable delivery location (fees then show as 0). */
  deliveryArea?: {
    id: number;
    name: string;
    minimumOrderAmount?: string | number | null;
    estimatedDeliveryMinutes?: number | null;
  } | null;
  deliveryMessage?: string | null;
  /** Backend minimum item subtotal for `deliveryArea` (money string). */
  minimumOrderAmount?: string | number | null;
  estimatedDeliveryMinutes?: number | null;
};

export type AddCartItemInput = {
  variantId: number;
  /** For a real pack-size variant this is a plain pack COUNT (1, 2, ...).
   * For a custom-quantity (UNIT_RATE) product's default variant, the
   * backend prices this by `unit_price(=the per-unit rate) * quantity`,
   * so this must be the actual root-unit amount (e.g. `0.5` for "500 g"
   * on a kg-priced product), NOT a selection count - see
   * `cartStore.ts`'s own comment on `apiBaseQty` for how the two stay in
   * sync as the local +/- stepper changes a line's count. */
  quantity: number;
  offerId?: number;
  offerType?: string;
};

/** GET /api/v1/orders/cart/ - the shopper's active cart (created lazily
 * server-side on first access). */
export const getCartApi = async (): Promise<CartViewApi> => {
  console.log('[cartApi] GET', API_CONFIG.CART.GET);
  const response = await api.get<CartViewApi>(API_CONFIG.CART.GET);
  console.log('[cartApi] GET response:', response.data);
  return response.data;
};

/** POST /api/v1/orders/cart/items/ - the backend merges this into an
 * existing line for the same `variant_id` rather than duplicating it, so
 * this is also what re-adding the same variant should call (not a
 * separate "increment" endpoint). */
export const addCartItemApi = async ({
  variantId,
  quantity,
  offerId,
  offerType,
}: AddCartItemInput): Promise<CartViewApi> => {
  const payload = {
    variant_id: variantId,
    quantity,
    ...(offerId != null ? { offer_id: offerId } : {}),
    ...(offerType != null ? { offer_type: offerType } : {}),     
  };
  console.log('[cartApi] POST', API_CONFIG.CART.ADD_ITEM, payload);
  const response = await api.post<CartViewApi>(API_CONFIG.CART.ADD_ITEM, payload);
  console.log("🚀 ~ addCartItemApi ~ response:", response)
  return response.data;
};

/** PATCH /api/v1/orders/cart/items/{cart_item_id}/ - sets the line's
 * quantity exactly (same "set, not delta" contract `cartStore.updateQuantity`
 * already has locally). */
export const updateCartItemQuantityApi = async (
  cartItemId: number,
  quantity: number,
): Promise<CartViewApi> => {
  console.log('[cartApi] PATCH', API_CONFIG.CART.UPDATE_ITEM(cartItemId), { quantity });
  const response = await api.patch<CartViewApi>(
    API_CONFIG.CART.UPDATE_ITEM(cartItemId),
    { quantity },
  );
  console.log('[cartApi] PATCH response:', response.data);
  return response.data;
};

/** DELETE /api/v1/orders/cart/items/{cart_item_id}/ */
export const removeCartItemApi = async (
  cartItemId: number,
): Promise<CartViewApi> => {
  console.log('[cartApi] DELETE', API_CONFIG.CART.REMOVE_ITEM(cartItemId));
  const response = await api.delete<CartViewApi>(
    API_CONFIG.CART.REMOVE_ITEM(cartItemId),
  );
  console.log('[cartApi] DELETE response:', response.data);
  return response.data;
};

/** DELETE /api/v1/orders/cart/ - clears every line in one call. */
export const clearCartApi = async (): Promise<CartViewApi> => {
  console.log('[cartApi] DELETE', API_CONFIG.CART.CLEAR);
  const response = await api.delete<CartViewApi>(API_CONFIG.CART.CLEAR);
  console.log('[cartApi] DELETE response:', response.data);
  return response.data;
};
