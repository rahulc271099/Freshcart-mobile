import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';

import { useWishlistStore } from '@/store/wishlistStore';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import type { CustomerQuantityRule } from '@/features/product/api/productApi';
import { AppImage } from './AppImage';
import { OfferBadge } from './OfferBadge';
import { PriceStack } from './PriceStack';
// The options button + variant-picker sheet used to live inline here -
// split into its own component so `ProductDetailsScreen` can render the
// exact same one instead of a second, separately-built picker. See
// ProductOptionsSheet.tsx's own top comment.
import { ProductOptionsSheet } from './ProductOptionsSheet';

/**
 * One purchasable pack size / weight for a product, e.g. "500 Gm" for
 * Apple. `label` has the product name already stripped off - it's read
 * inside the variant sheet, which is titled with the product's own name.
 */
export interface ProductVariant {
  id: string;
  label: string;
  /** The price the user actually pays (final selling price) - never MRP. */
  price: number;
  /** Struck-through reference price, only rendered when it's actually
   * higher than `price` - i.e. only when there's a genuine discount. */
  mrp?: number;
  /** The backend's own pre-offer `sellingPrice` for this exact row (a
   * real variant or quantity-choice), when it's genuinely higher than
   * `price` - i.e. a live offer actually discounted it. More specific
   * than `mrp` (the product's general listed MRP, which is frequently
   * null even when an offer is active - see `ProductOptionsSheet.tsx`'s
   * own notes) and takes priority over it when both are set. */
  sellingPriceBeforeOffer?: number;
  /** Rupees knocked off by a FLAT offer on this exact variant (the
   * backend's own `discountAmount`) - drives the "₹20 OFF" badge. Unset
   * for percent offers and for no offer. */
  flatOffAmount?: number;
  isDefault: boolean;
  /** True only for the synthetic "selection" built from a custom-quantity
   * (loose/bulk, sold-by-weight) pick - never for a real pack-size
   * variant. The screen wiring `onAddToCart` up to `cartStore` reads this
   * to decide `setCustomQuantityLine` (one line per product, replaced on
   * every pick) vs `addVariantLine` (a separate line per real variant) -
   * see `cartStore.ts`'s own comment for why the two need different
   * merge behavior. */
  isCustomQuantitySelection?: boolean;
  /** The REAL backend `variant_id` to cart-sync against - see
   * `cartStore.ts`'s own comment on `CartItem.apiVariantId` for why this
   * has to be threaded through separately from `id` above (which is a
   * `quantityChoiceId`, not a variant id, for a custom-quantity row).
   * Absent for a dummy/legacy product with no live catalogue row. */
  apiVariantId?: number;
  /** Custom-quantity selections only - see `cartStore.ts`'s own comment
   * on `CartItem.apiBaseQty`. */
  apiBaseQty?: number;
  /** Custom-quantity selections only - the backend's own min/max/step
   * rule for this product (from `/quantity-choices/`), snapshotted here
   * so it rides along into `CartItem.quantityRule` at add-time - see
   * that field's own comment for why the cart screen's stepper needs
   * this cached rather than re-fetched. */
  quantityRule?: CustomerQuantityRule;
  /** Custom-quantity selections only - the short unit code (e.g. "kg",
   * "g") `apiBaseQty` is measured in, so a line's weight can be
   * relabelled (e.g. "3 kg" -> "3.25 kg") after the cart stepper changes
   * it, instead of freezing whatever text was true at add-time. */
  pricingUnitLabel?: string;
}

/**
 * A discount exactly as the backend reported it. `percent`/`flat` carry a
 * real number; `label` is for the customer-listing endpoint, which only
 * ever exposes a pre-formatted string (e.g. "10% off") and no raw value -
 * see `mapCatalogueData.ts`'s `resolveDiscount`. `null`/`undefined` means
 * no discount, and nothing discount-shaped should render.
 */
export type ProductDiscount =
  | { kind: 'percent'; value: number }
  | { kind: 'flat'; value: number }
  | { kind: 'label'; label: string };

/**
 * Shared product-card shape for the whole app (Home, Categories, Search).
 * Deliberately additive on top of the original Home `Product` type -
 * `id/name/price/unit/imageUri/discountPercent/badgeOverride/inStock` keep
 * their exact old meaning and required-ness, so Home's existing dummy data
 * and `features/product/*` (which still reads this type) don't need to
 * change shape. Everything a "real" catalogue item adds is optional - the
 * card below derives sensible fallbacks when it's absent.
 */
export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUri: string;
  discountPercent?: number;
  badgeOverride?: 'NEW' | 'BEST_SELLER';
  inStock?: boolean;
  /** Bare product name with no pack size in it, e.g. "Apple Gala" - used
   * as the variant sheet's title. Falls back to `name` when absent. */
  baseName?: string;
  mrp?: number;
  /** Same idea as `ProductVariant.sellingPriceBeforeOffer`, for the
   * product-card level: the default variant's backend `sellingPrice`
   * when it's genuinely higher than `price` (a live offer discounted
   * it). Set by the real catalogue mappers in `mapCatalogueData.ts` -
   * absent for Home's dummy products, which fall back to `mrp`/`discount`
   * below. Takes priority over `mrp` when both are set. */
  sellingPriceBeforeOffer?: number;
  discount?: ProductDiscount | null;
  /** Pre-formatted per-unit rate, e.g. "₹20.00/unit" - shown under the
   * price when the backend can compute one. */
  pricePerUnit?: string;
  deliveryMins?: number;
  /** Every purchasable pack size, known up front - only ever set by
   * legacy/dummy data (Home). Real catalogue products leave this unset
   * and get their options fetched lazily instead, see the four fields
   * below. */
  variants?: ProductVariant[];
  /** Numeric backend product id. Required (together with the three
   * routing flags below) for the "Options" button to fetch real pack
   * sizes on tap - see `resolveOptionsMode`. Home's dummy products don't
   * set this, so they fall back to `variants` (or a single synthesized
   * variant from `price`/`unit`/`mrp`) and never hit the network. */
  catalogueProductId?: number;
  /** How many pack sizes/choices this product has - shown on the Options
   * button without needing the full list loaded first. Falls back to
   * `variants?.length` when absent. */
  optionCount?: number;
  isCustomQty?: boolean;
  isVariableWeight?: boolean;
  pricingMethod?: 'FIXED' | 'UNIT_RATE';
}

interface ProductCardProps {
  product: Product;
  /** Fired once per chosen option with a quantity > 0 when the sheet's
   * "Done"/"Add to Cart" is pressed (not per tap) - the cart only tracks
   * quantity by product id today (see `cartStore.ts`), so multiple
   * options currently collapse into the same cart line; `variant` and
   * `quantity` are still passed through so only this call site needs to
   * change once the cart supports per-variant line items. */
  onAddToCart?: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => void;
  onPress?: (product: Product) => void;
}

// ── Fallback resolvers (legacy/dummy data - no live catalogue id) ───────

// Exported - `ProductOptionsSheet.tsx` (this card's options button/sheet,
// split into its own component - see its own top comment) needs both for
// its client-side fallback path (legacy/dummy products with no live
// catalogue id).
export function resolveDiscount(product: Product): ProductDiscount | null {
  if (product.discount !== undefined) return product.discount;
  if (product.discountPercent != null) {
    return { kind: 'percent', value: Math.round(product.discountPercent) };
  }
  return null;
}

export function resolveMrp(
  product: Product,
  discount: ProductDiscount | null,
): number | undefined {
  if (product.mrp != null) return product.mrp;
  if (!discount || discount.kind === 'label') return undefined;
  return discount.kind === 'percent'
    ? Math.round(product.price / (1 - discount.value / 100))
    : product.price + discount.value;
}

const IMAGE_ASPECT_RATIO = 1;
// The name row reserves this much space whether the name wraps to one or
// two lines, so every card in a row/grid ends up exactly the same height
// regardless of how long a given product's name is.
const NAME_HEIGHT = 34; // 2 lines @ 17 lineHeight

export function ProductCard({
  product,
  onAddToCart,
  onPress,
}: ProductCardProps) {
  console.log('🚀 ~ ProductCard ~ product:', product);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inStock = product.inStock !== false;

  const discount = useMemo(() => resolveDiscount(product), [product]);
  const mrp = useMemo(() => resolveMrp(product, discount), [product, discount]);
  // The struck-through price is the MRP whenever it is higher than the
  // price paid; the pre-offer selling price is only a fallback for items
  // with no MRP (see `Product.sellingPriceBeforeOffer`).
  const beforePrice =
    mrp != null && mrp > product.price
      ? mrp
      : product.sellingPriceBeforeOffer ?? (discount != null ? mrp : undefined);

  const isWishlisted = useWishlistStore(state =>
    state.isWishlisted(product.id),
  );
  const toggleWishlist = useWishlistStore(state => state.toggle);

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(product)}>
      {/* ── Image section ──────────────────────────────── */}
      <View style={styles.imageWrap}>
        {inStock && product.badgeOverride ? (
          <View style={[styles.textBadge, styles.topLeftBadge]}>
            <Text style={styles.textBadgeLabel}>
              {product.badgeOverride === 'NEW' ? 'NEW' : 'BEST SELLER'}
            </Text>
          </View>
        ) : inStock && discount ? (
          <OfferBadge
            percent={discount.kind === 'percent' ? discount.value : undefined}
            label={
              discount.kind === 'flat'
                ? `₹${discount.value} OFF`
                : discount.kind === 'label'
                ? discount.label
                : undefined
            }
            style={styles.ribbonPosition}
          />
        ) : null}

        <Pressable
          style={styles.heartBtn}
          onPress={() => toggleWishlist(product.id)}
          hitSlop={8}
          accessibilityLabel={
            isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
        >
          <Heart
            color={isWishlisted ? colors.error : colors.textSecondary}
            fill={isWishlisted ? colors.error : 'transparent'}
            size={14}
            strokeWidth={2}
          />
        </Pressable>

        <AppImage
          source={{ uri: product.imageUri }}
          style={[styles.image, !inStock && styles.imageOutOfStock]}
          resizeMode="contain"
        />

        {!inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of stock</Text>
          </View>
        )}
      </View>

      {/* Separates the image from the details below it - a plain divider
          line rather than the two blocks just touching. */}
      <View style={styles.divider} />

      {/* ── Info section ───────────────────────────────── */}
      {/* Simplified per request to exactly: image -> name -> a single
          price + options row. The old delivery-time row ("11 MINS"), the
          discount-percent row (redundant with the OfferBadge already on
          the image above) and the per-unit-rate row ("25/unit", "/kg")
          are gone - `product.name` is expected to carry weight/unit info
          itself when relevant, per the new card spec. */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <PriceStack
            price={product.price}
            beforePrice={beforePrice}
            size="sm"
          />

          {inStock ? (
            <ProductOptionsSheet product={product} onAddToCart={onAddToCart} />
          ) : (
            <Pressable hitSlop={8} onPress={() => {}} style={styles.notifyWrap}>
              <Text style={styles.notifyText}>Notify me</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      // Flat by design - a border already separates the card from
      // whatever it sits on, so it doesn't also need a shadow to read as
      // a distinct surface. Modern grocery-app grids lean flat/bordered
      // rather than heavily drop-shadowed.
    },
    // Square, width-driven aspect ratio (not a fixed pixel height) so the
    // image scales correctly whether the card sits in a 2-column grid
    // (Categories/Search) or a fixed-width horizontal list (Home) - same
    // card, no per-screen size constants needed here. Because every card
    // in a row shares the same column width, this alone keeps every
    // card's image the same height too.
    imageWrap: {
      width: '100%',
      aspectRatio: IMAGE_ASPECT_RATIO,
      backgroundColor: colors.surface,
      position: 'relative',
    },
    topLeftBadge: {
      position: 'absolute',
      top: spacing.xs,
      left: spacing.xs,
      zIndex: 1,
    },
    // Matches the other two `OfferBadge` call sites' inset positioning
    // (`ProductImageCarousel`, `CartItemRow`) now that it's a
    // self-contained floating pill rather than a flush-corner ribbon -
    // see OfferBadge's own comment.
    ribbonPosition: {
      position: 'absolute',
      top: spacing.xs,
      left: spacing.xs,
      zIndex: 1,
    },
    textBadge: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    textBadgeLabel: {
      color: colors.textInverse,
      fontSize: 9,
      fontFamily: fonts.bold,
      lineHeight: 11,
    },
    heartBtn: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      zIndex: 1,
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageOutOfStock: {
      opacity: 0.4,
    },
    outOfStockOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      paddingVertical: 4,
      backgroundColor: colors.overlay,
    },
    outOfStockText: {
      color: colors.textInverse,
      fontSize: 9,
      fontFamily: fonts.semiBold,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    info: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    name: {
      height: NAME_HEIGHT,
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
      lineHeight: 17,
    },
    // Single row: price group on the left, options/notify on the right.
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      minHeight: 18,
    },
    notifyWrap: {
      marginLeft: 'auto',
    },
    notifyText: {
      fontSize: 10,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
}
