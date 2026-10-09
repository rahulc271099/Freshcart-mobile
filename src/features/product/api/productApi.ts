import type {
  CustomerProductCard,
  CustomerProductDefaultVariant,
} from '@/features/categories/api/categoriesApi';
import { api } from '@/services/api/api';
import API_CONFIG from '@/services/api/apiConfig';

/**
 * Shared shape both detail endpoints below return before their own
 * extra fields (`choices`/`variants`) - same base fields as the listing's
 * `CustomerProductCard`, minus `offer` (these two endpoints return
 * `offers` - a detailed array - instead), and with `defaultVariant`'s
 * price resolved to what the shopper actually pays.
 */
type CustomerProductDetailBase = Omit<CustomerProductCard, 'offer' | 'defaultVariant'> & {
  defaultVariant:
    | (CustomerProductDefaultVariant & { finalSellingPrice: number })
    | null;
};

/** Loose on purpose - the sheet only ever reads `label` off these today;
 * the backend's full offer shape (tiers, buy-X-get-Y rules, bundle
 * components, ...) isn't rendered anywhere yet. */
export type CustomerOfferDetail = {
  offerId: number;
  offerType: string;
  label: string;
  [key: string]: unknown;
};

// ── GET .../customer/products/{id}/ ─────────────────────────────────────
// Single-product read for the Product Details screen. Structurally a
// superset of `CustomerProductCard` (same base fields the listing/
// quantity-choices/variants endpoints all share, via the server's own
// `card()` builder - see `CustomerProductService.product_detail`), so
// `mapCustomerProductCardToProduct` works on this directly without a
// separate mapper.

export type CustomerProductDetail = Omit<CustomerProductCard, 'defaultVariant'> & {
  defaultVariant:
    | (CustomerProductDefaultVariant & { finalSellingPrice: number })
    | null;
  /** Only present for UNIT_RATE-priced products (mirrors the
   * quantity-choices endpoint's own top-level rate fields). */
  unitRate?: number | null;
  finalUnitRate?: number | null;
};

export const getProductDetailApi = async (
  productId: number,
): Promise<CustomerProductDetail> => {
  const response = await api.get<CustomerProductDetail>(
    API_CONFIG.PRODUCTS.CUSTOMER_DETAIL(productId),
  );
  return response.data;
};

// ── GET .../quantity-choices/ ───────────────────────────────────────────
// Only valid when isCustomQty && !isVariableWeight && pricingMethod ===
// 'UNIT_RATE' - see resolveOptionsMode() below.

export type CustomerQuantityChoice = {
  quantityChoiceId: number;
  quantity: number;
  /** Backend-formatted label in the product's own root unit, e.g. "250 g" -
   * not reformatted client-side. */
  label: string;
  isDefault: boolean;
  /** Already scaled to this choice's quantity (i.e. the total for picking
   * it), not a per-unit rate - same for `sellingPrice`/`finalSellingPrice`
   * below. */
  mrp: number | null;
  sellingPrice: number | null;
  finalSellingPrice: number | null;
};

export type CustomerQuantityRule = {
  minQty: number;
  maxQty: number;
  stepQty: number;
};

export type CustomerProductQuantityChoices = CustomerProductDetailBase & {
  /** Per-unit rate (before/after discount) - `choices[].finalSellingPrice`
   * is this multiplied by that choice's quantity; the slider multiplies
   * the same way for any in-between value the shopper drags to. */
  unitRate: number | null;
  finalUnitRate: number | null;
  quantityRule: CustomerQuantityRule;
  choices: CustomerQuantityChoice[];
  offers: CustomerOfferDetail[];
};

export const getProductQuantityChoicesApi = async (
  productId: number,
): Promise<CustomerProductQuantityChoices> => {
  const response = await api.get<CustomerProductQuantityChoices>(
    API_CONFIG.PRODUCTS.CUSTOMER_QUANTITY_CHOICES(productId),
  );
  return response.data;
};

// ── GET .../variants/ ───────────────────────────────────────────────────
// Valid for every product NOT covered by quantity-choices above (fixed
// pack-size variants, variable-weight products, and unit-rate products
// sold as a fixed set of weight variants rather than a free quantity).

type CustomerVariantBase = {
  variantId: number;
  variantName: string | null;
  sku: string | null;
  uomQty: number | null;
  minWeightG: number | null;
  maxWeightG: number | null;
  isDefault: boolean;
  imageUrl: string | null;
  /** Present on a variant a live offer applies to - `discountAmount` is
   * the backend's own rupees-off figure (`discountType` FLAT or PERCENT). */
  discountType?: 'FLAT' | 'PERCENT' | null;
  discountValue?: number | null;
  discountAmount?: number | null;
};

/** The common case: this pack size has its own real price. */
export type CustomerVariantPriced = CustomerVariantBase & {
  mrp: number | null;
  sellingPrice: number;
  finalSellingPrice: number;
};

/** `pricingMethod === 'UNIT_RATE'` variants carry the product's shared
 * per-unit rate instead of their own price - the backend deliberately
 * strips `mrp`/`sellingPrice` from these rows rather than repeating the
 * same rate on every one. */
export type CustomerVariantRated = CustomerVariantBase & {
  unitRate: number;
  finalUnitRate: number;
};

export type CustomerVariant = CustomerVariantPriced | CustomerVariantRated;

export function isRatedVariant(
  variant: CustomerVariant,
): variant is CustomerVariantRated {
  return 'finalUnitRate' in variant;
}

export type CustomerProductVariants = CustomerProductDetailBase & {
  type: 'VARIABLE_WEIGHT' | 'FIXED_VARIANT' | 'UNIT_RATE_VARIANT';
  variants: CustomerVariant[];
  offers: CustomerOfferDetail[];
};

export const getProductVariantsApi = async (
  productId: number,
): Promise<CustomerProductVariants> => {
  const response = await api.get<CustomerProductVariants>(
    API_CONFIG.PRODUCTS.CUSTOMER_VARIANTS(productId),
  );
  console.log("🚀 ~ getProductVariantsApi ~ response:", response)
  return response.data;
};

// ── Routing ──────────────────────────────────────────────────────────────

export interface ProductOptionsRoutingFlags {
  isCustomQty: boolean;
  isVariableWeight: boolean;
  pricingMethod: 'FIXED' | 'UNIT_RATE';
}

/**
 * Mirrors the backend's own gate in `CustomerProductService.quantity_choices`
 * exactly (`isCustomQty && not isVariableWeight and pricingMethod ==
 * 'UNIT_RATE'`) - calling the wrong one of the two endpoints above for a
 * given product is a 400 (`DomainError`), not just the "wrong" data, so
 * this has to match precisely rather than just checking `isCustomQty`.
 */
export function resolveOptionsMode(
  product: ProductOptionsRoutingFlags,
): 'quantity-choices' | 'variants' {
  return product.isCustomQty &&
    !product.isVariableWeight &&
    product.pricingMethod === 'UNIT_RATE'
    ? 'quantity-choices'
    : 'variants';
}
