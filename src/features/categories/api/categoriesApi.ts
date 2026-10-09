import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';

// ── Groups ───────────────────────────────────────────────────────────────

/**
 * Matches the confirmed contract:
 *   GET /api/v1/catalogue/groups/
 *
 * Verified directly against the deployed server - the backend returns
 * snake_case fields here (unlike the camelCase customer-facing responses
 * below), so this is left as-is rather than "cleaned up" to match.
 */
export type CatalogueGroup = {
  group_id: number;
  category_id: number;
  parent_group_id: number | null;
  name: string;
  display_name: string;
  slug: string;
  regional_name: string | null;
  ref_code: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
};

/**
 * Fetches every group across every category in one flat call (e.g.
 * "Fresh Fruits" AND "Leafy Vegetables" together - the backend also
 * exposes a category-scoped /categories/{category_id}/groups/, but the
 * Category screen calls this flat one, per the confirmed contract above).
 */
export const getGroupsApi = async (): Promise<CatalogueGroup[]> => {
  const response = await api.get<CatalogueGroup[]>(API_CONFIG.GROUPS.LIST);
  return response.data;
};

// ── Products (tree) ─────────────────────────────────────────────────────
// Kept as a data source for anything that genuinely needs the WHOLE
// catalogue in one shot - the Categories screen itself no longer uses
// this (see getCustomerProductsApi below), since it fetches every active
// product's every variant regardless of which group is actually being
// viewed. That unfiltered, un-paginated payload was the single biggest
// contributor to this screen feeling slow to load.

export type ProductTreeVariant = {
  variantId: number;
  variantName: string | null;
  barcode: string | null;
  uomId: number | null;
  uomQty: number | null;
  mrp: number | null;
  sellingPrice: number;
  finalSellingPrice: number;
  costPrice: number;
  isDefault: boolean;
  isAvailableForDelivery: boolean;
};

export type ProductTreeItem = {
  productId: number;
  groupId: number;
  brandId: number | null;
  displayName: string;
  regionalName: string | null;
  isCustomQty: boolean;
  minOrderQty: number;
  maxOrderQty: number;
  stepQty: number;
  isVariableWeight: boolean;
  imageUrl: string | null;
  isCombo: boolean;
  displayOrder: number;
  isActive: boolean;
  flatDiscount: number | null;
  percentDiscount: number | null;
  variants: ProductTreeVariant[];
};

export const getProductsTreeApi = async (): Promise<ProductTreeItem[]> => {
  const response = await api.get<ProductTreeItem[]>(API_CONFIG.PRODUCTS.TREE);
  return response.data;
};

// ── Products (customer listing) ─────────────────────────────────────────
// Matches the confirmed contract:
//   GET /api/v1/catalogue/customer/products/?group_id=&limit=&offset=
// Server-side paginated and filterable (group/category/brand/search) - the
// Categories screen uses this, scoped to the active group, instead of
// `getProductsTreeApi` above.

export type CustomerProductUom = {
  id: number;
  name: string;
  shortCode: string;
};

/** The one variant shown on the card itself - NOT the full variant list
 * (that only loads once the shopper actually opens the options sheet, via
 * `getProductVariantsApi`/`getProductQuantityChoicesApi` in
 * `features/product/api/productApi.ts`). */
export type CustomerProductDefaultVariant = {
  variantId: number;
  variantName: string | null;
  sku: string | null;
  mrp: number | null;
  sellingPrice: number;
  /** The real, post-offer amount for this pack size - the backend's
   * `CustomerProductService.card()` injects this into `defaultVariant`
   * on EVERY endpoint that calls `card()` (including this listing one),
   * via `final_selling_price()`. Previously missing from this type, which
   * made the listing/card screens fall back to showing `sellingPrice`
   * (the pre-offer price) as if it were final - this is the field that
   * was actually missing, not a backend gap (see the Freshcart project
   * doc's API-audit notes). `null` only when `sellingPrice` itself is
   * null (no price set at all). */
  finalSellingPrice: number | null;
  uomQty: number | null;
  isDefault: boolean;
  isAvailableForDelivery: boolean;
};

/** A pre-formatted offer summary - `label` is the backend's own display
 * string (e.g. "10% off"), not a number this layer computes. See
 * `resolveDiscount()` in `mapCatalogueData.ts` for why the card trusts
 * this text as-is instead of re-deriving a percentage from it. */
export type CustomerProductOffer =
  | { hasOffer: true; offerType: string; label: string }
  | { hasOffer: false };

export type CustomerProductCard = {
  productId: number;
  groupId: number;
  brandId: number | null;
  name: string;
  displayName: string;
  slug: string;
  imageUrl: string | null;
  pricingMethod: 'FIXED' | 'UNIT_RATE';
  isCustomQty: boolean;
  isVariableWeight: boolean;
  pricingUom: CustomerProductUom | null;
  orderUom: CustomerProductUom | null;
  defaultVariant: CustomerProductDefaultVariant | null;
  /** How many pack sizes / quantity choices this product has - the "N
   * Options" count shown on the card's options button, known up front so
   * the full list doesn't need to be fetched just to render that. */
  optionCount: number;
  offer: CustomerProductOffer;
  /**
   * Raw per-product discount columns (`Products.FlatDiscount`/
   * `PercentDiscount`) - always present on every card (see
   * `CustomerProductService.card()` on the backend), NOT gated behind
   * `offer.hasOffer`. These are the same values the backend's own
   * `snapshot_offer()`/`final_selling_price()` compute the detail/
   * variants/quantity-choices endpoints' real discounted prices from -
   * but this listing endpoint never calls that helper, so there is no
   * backend-computed final price here (see `mapCatalogueData.ts`'s own
   * comment on `price`). Exposed here for completeness/transparency only
   * - per this project's "never calculate discounts in the frontend"
   * rule, nothing in this app derives a price from these two fields.
   */
  flatDiscount: number | null;
  percentDiscount: number | null;
};

export type CustomerProductsPage = {
  results: CustomerProductCard[];
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export interface GetCustomerProductsParams {
  groupId: number;
  /** Capped well above what a single group realistically holds so the
   * screen doesn't need pagination UI yet, while staying far lighter than
   * fetching every group's products in one go. `hasMore`/`nextOffset` are
   * still returned by the backend for when infinite-scroll is added. */
  limit?: number;
  offset?: number;
}

export const getCustomerProductsApi = async ({
  groupId,
  limit = 100,
  offset = 0,
}: GetCustomerProductsParams): Promise<CustomerProductsPage> => {
  const response = await api.get<CustomerProductsPage>(
    API_CONFIG.PRODUCTS.CUSTOMER_LIST,
    { params: { group_id: groupId, limit, offset } },
  );
  console.log("🚀 ~ getCustomerProductsApi ~ response:", response)
  return response.data;
};
