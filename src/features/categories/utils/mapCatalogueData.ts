import type { Product, ProductDiscount } from '@/components';
import type { SidebarCategory } from '../components/CategorySidebarItem';
import type { CatalogueGroup, CustomerProductCard } from '../api/categoriesApi';
import type { CustomerProductVariants } from '@/features/product/api/productApi';

// Known-good images already used elsewhere in this app (the old dummy
// SIDEBAR_CATEGORIES / PRODUCTS arrays) - used as a fallback only, since
// the backend currently returns `image_url: null` for every group and
// some products have no image either.
const FALLBACK_GROUP_IMAGE =
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80';
const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1596097558038-c7f8cbf7a851?w=400&q=80';

// The customer listing endpoint has no delivery-time field - hardcoded to
// match the rest of the app's placeholder value until a real ETA source
// exists.
const DEFAULT_DELIVERY_MINS = 11;

export function mapGroupToSidebarCategory(
  group: CatalogueGroup,
): SidebarCategory {
  return {
    id: String(group.group_id),
    label: group.display_name,
    imageUri: group.image_url ?? FALLBACK_GROUP_IMAGE,
  };
}

/**
 * Variant/default-variant names from the backend often repeat the product
 * name, e.g. "Tomato 1 kg" under product "Tomato" - this strips that
 * prefix so the card just shows the distinguishing part. Falls back to the
 * bare product name when the backend hasn't set one at all.
 */
function stripNamePrefix(label: string, baseName: string): string {
  const prefix = `${baseName} `;
  return label.startsWith(prefix) ? label.slice(prefix.length) : label;
}

/**
 * The listing endpoint reports a discount only as a pre-formatted label
 * (e.g. "10% off") - never a raw percent/flat number (see
 * `CustomerProductOffer`'s own comment) - so this is trusted and shown
 * as-is rather than re-derived into a percentage. `hasOffer: false` (or
 * absent) means no discount, same "never fabricate one" rule as before.
 */
function resolveDiscount(card: CustomerProductCard): ProductDiscount | null {
  return card.offer.hasOffer
    ? { kind: 'label', label: card.offer.label }
    : null;
}

/**
 * `defaultVariant.uomQty` is "how many `pricingUom` units this pack
 * equals" (e.g. 500 g), so `sellingPrice / uomQty` is a real per-unit
 * rate - the unit itself isn't named ("/unit", not "/g") for the same
 * reason the old tree-based mapping didn't: resolving `pricingUom` to a
 * short code the shopper recognizes needs the UOM lookup table, which
 * this screen doesn't fetch.
 */
function formatPricePerUnit(
  card: Pick<CustomerProductCard, 'defaultVariant'>,
): string | undefined {
  const variant = card.defaultVariant;
  if (!variant?.uomQty) return undefined;
  return `₹${(variant.sellingPrice / variant.uomQty).toFixed(2)}/unit`;
}

/** MRP to strike through: only when it is set and higher than what the
 * shopper pays (`mrp` is frequently null, and equal means no saving). */
function resolveMrp(
  mrp: number | null | undefined,
  finalPrice: number,
): number | undefined {
  return mrp != null && mrp > finalPrice ? mrp : undefined;
}

/** Pre-offer selling price, used only when there is no MRP to show. */
function resolveBeforeOffer(
  sellingPrice: number | null | undefined,
  finalPrice: number,
): number | undefined {
  return sellingPrice != null && sellingPrice > finalPrice
    ? sellingPrice
    : undefined;
}

/**
 * Maps one customer-listing card (`GET /catalogue/customer/products/`) to
 * the shared `Product` shape `ProductCard` (in `@/components`) renders -
 * the same card used on Home. Unlike the old tree-based mapping, this
 * does NOT include `variants` - the listing endpoint only ever returns
 * the default pack size; the full option list loads lazily, once the
 * shopper actually taps "Options" (see `ProductCard`'s own comment on
 * `catalogueProductId`/`resolveOptionsMode`).
 */
export function mapCustomerProductCardToProduct(
  card: CustomerProductCard,
): Product {
  const discount = resolveDiscount(card);
  const defaultVariant = card.defaultVariant;
  // `defaultVariant.finalSellingPrice` is the real amount charged (the
  // backend injects it on every card endpoint). The struck-through
  // reference is the variant's MRP - never the pre-offer selling price -
  // shown only when it is genuinely higher than what the shopper pays.
  const finalPrice =
    defaultVariant?.finalSellingPrice ?? defaultVariant?.sellingPrice ?? 0;
  const mrp = resolveMrp(defaultVariant?.mrp, finalPrice);

  return {
    id: String(card.productId),
    catalogueProductId: card.productId,
    baseName: card.displayName,
    name: defaultVariant?.variantName ?? card.displayName,
    unit: defaultVariant?.variantName
      ? stripNamePrefix(defaultVariant.variantName, card.displayName)
      : card.pricingUom?.shortCode ?? '1 pc',
    imageUri: card.imageUrl ?? FALLBACK_PRODUCT_IMAGE,
    price: finalPrice,
    mrp,
    // Only a fallback for products with no MRP at all (e.g. unit-rate
    // items); `ProductCard` always prefers `mrp`.
    sellingPriceBeforeOffer:
      mrp == null
        ? resolveBeforeOffer(defaultVariant?.sellingPrice, finalPrice)
        : undefined,
    discount,
    pricePerUnit: formatPricePerUnit(card),
    deliveryMins: DEFAULT_DELIVERY_MINS,
    optionCount: card.optionCount,
    isCustomQty: card.isCustomQty,
    isVariableWeight: card.isVariableWeight,
    pricingMethod: card.pricingMethod,
  };
}

/**
 * Maps the variants endpoint's response (`GET .../variants/`) to the
 * shared `Product` shape - used by the Product Details screen INSTEAD of
 * the single-product detail endpoint (`.../customer/products/{id}/`),
 * which isn't implemented on the backend, and by `cartStore.ts`'s
 * `hydrateFromServer` to backfill display data for an orphan cart line
 * (see that function's own comment). `defaultVariant.finalSellingPrice`
 * is already the real, post-discount price the shopper pays (see
 * `CustomerProductDetailBase`'s own comment), so unlike the old
 * detail-endpoint mapping this needs no separate override step. Discount
 * here comes from `offers` (an array) rather than the listing endpoint's
 * single `offer` object - same distinction `ProductCard.tsx`'s
 * `convertApiVariants` already makes for this same endpoint.
 */
export function mapCustomerVariantsToProduct(
  data: CustomerProductVariants,
): Product {
  const hasDiscount = data.offers.length > 0;
  const defaultVariant = data.defaultVariant;
  const finalPrice = defaultVariant?.finalSellingPrice ?? 0;
  const mrp = resolveMrp(defaultVariant?.mrp, finalPrice);

  return {
    id: String(data.productId),
    catalogueProductId: data.productId,
    baseName: data.displayName,
    name: defaultVariant?.variantName ?? data.displayName,
    unit: defaultVariant?.variantName
      ? stripNamePrefix(defaultVariant.variantName, data.displayName)
      : data.pricingUom?.shortCode ?? '1 pc',
    imageUri: data.imageUrl ?? FALLBACK_PRODUCT_IMAGE,
    price: finalPrice,
    mrp,
    sellingPriceBeforeOffer:
      mrp == null
        ? resolveBeforeOffer(defaultVariant?.sellingPrice, finalPrice)
        : undefined,
    discount: hasDiscount
      ? { kind: 'label', label: data.offers[0].label }
      : null,
    deliveryMins: DEFAULT_DELIVERY_MINS,
    optionCount: data.optionCount,
    isCustomQty: data.isCustomQty,
    isVariableWeight: data.isVariableWeight,
    pricingMethod: data.pricingMethod,
  };
}
