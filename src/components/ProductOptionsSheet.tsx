import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Minus, Plus } from 'lucide-react-native';

import { AppImage } from './AppImage';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Loader } from './Loader';
import { OfferBadge } from './OfferBadge';
import { PriceStack } from './PriceStack';
import {
  resolveOptionsMode,
  type CustomerOfferDetail,
  type CustomerProductVariants,
  type CustomerVariant,
} from '@/features/product/api/productApi';
import { useProductQuantityChoices } from '@/features/product/hooks/useProductQuantityChoices';
import { useProductVariants } from '@/features/product/hooks/useProductVariants';
import { useCartStore } from '@/store/cartStore';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import {
  resolveDiscount,
  resolveMrp,
  type Product,
  type ProductVariant,
} from './ProductCard';

/** Rounds a display-only money figure to 2 decimals - used ONLY for
 * scaling an already-final backend rate (`finalUnitRate`/`unitRate`) by a
 * shopper-chosen quantity, same category as this sheet's own `total`
 * footer (which already sums backend-final per-row prices by a picked
 * count) - never a NEW discount derivation. */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function countDecimals(value: number): number {
  const str = value.toString();
  const i = str.indexOf('.');
  return i === -1 ? 0 : str.length - i - 1;
}

/** Snaps `value` onto the nearest multiple of `step`, fixed to `step`'s
 * own decimal precision so e.g. repeated +0.25 taps land on 0.25/0.5/0.75
 * instead of drifting to 0.2500000000000002. */
function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const decimals = countDecimals(step);
  const snapped = Math.round(value / step) * step;
  return Number(snapped.toFixed(decimals));
}

/** Trims a quantity to its own shortest exact decimal form - 0.25 stays
 * "0.25", 1 shows as "1", never "1.00" or floating-point noise. */
function formatQty(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function resolveVariants(
  product: Product,
  mrp: number | undefined,
): ProductVariant[] {
  if (product.variants && product.variants.length > 0) return product.variants;
  return [
    {
      id: product.id,
      label: product.unit,
      price: product.price,
      mrp,
      isDefault: true,
    },
  ];
}

// ── Live variants (fetched on Options tap) → ProductVariant[] ───────────

/** Rupees off for a FLAT offer, straight from the backend's own
 * `discountAmount` (nothing is calculated here). */
function getFlatOffAmount(variant: CustomerVariant): number | undefined {
  return variant.discountType === 'FLAT' &&
    typeof variant.discountAmount === 'number' &&
    variant.discountAmount > 0
    ? variant.discountAmount
    : undefined;
}

function convertApiVariants(data: CustomerProductVariants): ProductVariant[] {
  console.log('🚀 ~ convertApiVariants ~ data:', data);
  return data.variants.map(variant => {
    const label = variant.variantName
      ? variant.variantName
      : variant.uomQty != null
      ? `${variant.uomQty} g`
      : '1 pc';

    if ('finalUnitRate' in variant) {
      // UNIT_RATE variants share one rate across every pack size rather
      // than each having its own price - shown as the rate itself rather
      // than guessed at by multiplying against a weight this payload
      // doesn't actually attach a conversion factor for.
      return {
        id: String(variant.variantId),
        label,
        price: variant.finalUnitRate,
        mrp: undefined,
        // A variant with its own offer reports its pre-offer figure as
        // `unitRate` (> `finalUnitRate` only while the offer applies).
        sellingPriceBeforeOffer:
          variant.unitRate > variant.finalUnitRate
            ? variant.unitRate
            : undefined,
        flatOffAmount: getFlatOffAmount(variant),
        isDefault: variant.isDefault,
        apiVariantId: variant.variantId,
      };
    }

    return {
      id: String(variant.variantId),
      label,
      price: variant.finalSellingPrice,
      mrp:
        variant.mrp != null && variant.mrp > variant.finalSellingPrice
          ? variant.mrp
          : undefined,
      // The real pre-offer price for THIS exact variant - more specific
      // than `mrp` above (which is the true listed MRP and is frequently
      // null even when a live offer genuinely discounted `sellingPrice`
      // down to `finalSellingPrice` - see `PriceStack`'s own comment on
      // why this wins over `mrp` when both are set).
      sellingPriceBeforeOffer:
        variant.mrp == null && variant.sellingPrice > variant.finalSellingPrice
          ? variant.sellingPrice
          : undefined,
      flatOffAmount: getFlatOffAmount(variant),
      isDefault: variant.isDefault,
      apiVariantId: variant.variantId,
    };
  });
}

export interface ProductOptionsSheetProps {
  product: Product;
  /** Fired once per chosen option with a quantity > 0 when the sheet's
   * "Done" is pressed - see `ProductCard.tsx`'s own comment on this same
   * prop (this component IS that card's options button + sheet, split
   * out so `ProductDetailsScreen` can use the exact same component/
   * behaviour instead of a second, separately-built picker). */
  onAddToCart?: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => void;
  /** 'pill' (default) is the small outline "N Options ⌄" trigger used
   * inline next to a price row (ProductDetailsScreen). 'fullWidth' is a
   * solid, card-width "Choose qty" button - what `ProductCard`'s grid
   * card uses at the bottom of its info section, matching the reference
   * listing-page mock. Same sheet/behaviour either way - only the
   * trigger's own look changes. */
  triggerVariant?: 'pill' | 'fullWidth';
}

/**
 * The "N Options ⌄" trigger button + its variant-picker bottom sheet -
 * split out of `ProductCard.tsx` (which still renders this internally for
 * its own card) so `ProductDetailsScreen` can use the exact same
 * component/behaviour instead of a second, separately-built picker. See
 * `ProductCard.tsx`'s own top comment for the full picture of how a
 * product's options resolve to real variants vs custom-quantity choices.
 *
 * Custom-quantity products (`isCustomQty && !isVariableWeight &&
 * pricingMethod === 'UNIT_RATE'`, e.g. Onion sold loose by weight) get a
 * SINGLE option card driven by the backend's own `quantityRule`
 * (min/max/step), not one row per predefined choice - the backend's
 * `choices` array (0.25 kg / 0.5 kg / 1 kg, ...) is shown instead as a
 * row of "quick select" chips below that card: tapping one jumps the
 * stepper straight to that weight, it doesn't add a second, separate
 * line. Real pack-size variants (`optionsMode === 'variants'`) keep the
 * original one-row-per-variant layout further down.
 */
export function ProductOptionsSheet({
  product,
  onAddToCart,
  triggerVariant = 'pill',
}: ProductOptionsSheetProps) {
  console.log('🚀 ~ ProductOptionsSheet ~ product:', product);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const baseName = product.baseName ?? product.name;
  const discount = useMemo(() => resolveDiscount(product), [product]);
  const mrp = useMemo(() => resolveMrp(product, discount), [product, discount]);
  const optionCount = product.optionCount ?? product.variants?.length ?? 1;

  // Cart's own source of truth (see cartStore.ts's top comment) - used
  // below to seed the sheet's row selections from what's actually
  // already in the cart, instead of always starting blank.
  const cartItems = useCartStore(state => state.items);
  const removeCartItem = useCartStore(state => state.removeItem);

  const [sheetVisible, setSheetVisible] = useState(false);
  // Real pack-size variants (and the legacy/dummy fallback): ONE quantity
  // PER variant, keyed by variant id. Each row is independent - ADD on one
  // pack size never clears or replaces another, so e.g. 500 g x1 and
  // 1 kg x2 of the same product can be picked in one visit. A missing key
  // (or 0) means "not added" (shows the ADD button).
  const [variantQtys, setVariantQtys] = useState<Record<string, number>>({});
  // Seeds `variantQtys` from the cart once per open (see the effect below).
  const [variantsSeeded, setVariantsSeeded] = useState(false);
  // Custom-quantity mode's one quantity value, in the product's own root
  // unit (e.g. kg) - 0 means "not added yet" (shows the ADD button);
  // bounded to `quantityRule.minQty..maxQty` in steps of `stepQty`, same
  // rule the backend itself enforces for `POST .../cart/items/`.
  const [customQty, setCustomQty] = useState(0);

  // A product is only routed to a live fetch when every field
  // `resolveOptionsMode` needs is actually present - Home's dummy
  // products never set these, so `optionsMode` stays `null` for them and
  // the sheet falls back to `resolveVariants` above, purely client-side.
  const routingFlags =
    product.catalogueProductId != null &&
    product.isCustomQty !== undefined &&
    product.isVariableWeight !== undefined &&
    product.pricingMethod !== undefined
      ? {
          isCustomQty: product.isCustomQty,
          isVariableWeight: product.isVariableWeight,
          pricingMethod: product.pricingMethod,
        }
      : null;
  const optionsMode = routingFlags ? resolveOptionsMode(routingFlags) : null;
  const catalogueProductId = product.catalogueProductId ?? -1;

  const quantityChoicesQuery = useProductQuantityChoices(
    catalogueProductId,
    sheetVisible && optionsMode === 'quantity-choices',
  );
  const variantsQuery = useProductVariants(
    catalogueProductId,
    sheetVisible && optionsMode === 'variants',
  );

  // Verifiable (e.g. in the Metro console) that the quantity-choices
  // payload - `quantityRule`/`choices`/`unitRate`/`finalUnitRate` - is
  // exactly what's driving the stepper/quick-select UI below, with
  // nothing recomputed in between.
  useEffect(() => {
    if (quantityChoicesQuery.data) {
      console.log(
        '🚀 ~ ProductOptionsSheet ~ quantityChoicesQuery.data:',
        quantityChoicesQuery.data,
      );
    }
  }, [quantityChoicesQuery.data]);

  // Every open starts from a clean slate - a sheet dismissed without
  // pressing "Done" shouldn't leave stale row selections behind for next
  // time.
  useEffect(() => {
    if (!sheetVisible) {
      setVariantQtys({});
      setVariantsSeeded(false);
      setCustomQty(0);
    }
  }, [sheetVisible]);

  // `null` means "still loading / not fetched yet" (only reachable for
  // the 'variants' live-fetch mode) - distinct from `[]`, which is a real
  // empty list. Legacy/dummy products always resolve synchronously.
  // Quantity-choices mode is rendered from `quantityChoicesQuery.data`
  // directly further down (its own single stepper card + quick-select
  // chips, not a list of rows), so it's deliberately NOT handled here.
  const activeVariants: ProductVariant[] | null = useMemo(() => {
    if (optionsMode === 'variants') {
      return variantsQuery.data ? convertApiVariants(variantsQuery.data) : null;
    }
    if (optionsMode === 'quantity-choices') return null;
    return resolveVariants(product, mrp);
  }, [optionsMode, variantsQuery.data, product, mrp]);
  console.log('🚀 ~ ProductOptionsSheet ~ activeVariants:', activeVariants);

  // Seed EVERY row from what's already in the cart for this product, so
  // re-opening the sheet reflects reality (all previously added pack
  // sizes, not just the first) instead of starting blank. Runs once per
  // open, after the variants have loaded. Skipped for quantity-choices
  // mode (see the dedicated `customQty`-seeding effect below).
  useEffect(() => {
    if (
      !sheetVisible ||
      optionsMode === 'quantity-choices' ||
      activeVariants === null ||
      variantsSeeded
    ) {
      return;
    }
    const seeded: Record<string, number> = {};
    for (const variant of activeVariants) {
      const existing = cartItems.find(
        item => item.id === `${product.id}:${variant.id}`,
      );
      if (existing && existing.quantity > 0) {
        seeded[variant.id] = existing.quantity;
      }
    }
    setVariantQtys(seeded);
    setVariantsSeeded(true);
  }, [
    sheetVisible,
    activeVariants,
    optionsMode,
    cartItems,
    product.id,
    variantsSeeded,
  ]);

  // Custom-quantity mode's own seeding - one continuous quantity, so this
  // just reads whatever `apiBaseQty` the cart line already has (if any),
  // rather than the old per-choice divisor-matching this replaced.
  useEffect(() => {
    if (!sheetVisible || optionsMode !== 'quantity-choices') return;
    if (customQty > 0) return; // already seeded/picked this open
    const existing = cartItems.find(item => item.id === product.id);
    if (existing?.apiBaseQty != null && existing.apiBaseQty > 0) {
      setCustomQty(existing.apiBaseQty);
    }
  }, [sheetVisible, optionsMode, cartItems, product.id, customQty]);

  // Shared by both live-fetch modes - which query is "the" options query
  // right now depends on which one is actually active.
  const optionsError =
    optionsMode === 'quantity-choices'
      ? quantityChoicesQuery.isError
      : optionsMode === 'variants'
      ? variantsQuery.isError
      : false;
  const refetchOptions =
    optionsMode === 'quantity-choices'
      ? quantityChoicesQuery.refetch
      : variantsQuery.refetch;

  // Real backend offer data for this product - `offers` here is the
  // detailed array both live-fetch endpoints return (offerId/offerType/
  // label, plus discountType/discountValue when it's a real PERCENT_OFF/
  // FLAT_OFF - see `CustomerOfferDetail`'s own comment), distinct from
  // the listing endpoint's bare `{hasOffer, offerType, label}` summary
  // `ProductCard` shows. Nothing here is computed client-side - a real
  // percent comes straight from `discountValue` when the backend reports
  // one, and falls back to the backend's own pre-formatted `label`
  // otherwise (e.g. a FLAT_OFF, or any offer type without a plain percent).
  // Logged as-is so it's verifiable (e.g. in the Metro console) that any
  // percent shown below came straight off this array, never frontend math.
  const offers: CustomerOfferDetail[] =
    optionsMode === 'quantity-choices'
      ? quantityChoicesQuery.data?.offers ?? []
      : optionsMode === 'variants'
      ? variantsQuery.data?.offers ?? []
      : [];
  console.log('[ProductOptionsSheet] offers from API:', offers);

  // Each offer can carry its own `variantIds` (which real variant ids it
  // applies to - see the backend's `OFFER_DETAILS` query). An offer with
  // no `variantIds` (or an empty list) applies to every row, matching the
  // backend's own fallback behaviour. The custom-quantity card has no
  // per-row variant id of its own (every quantity prices off the SAME
  // underlying SKU), so it resolves against the product's one
  // `defaultVariant`, same as before.
  const resolveVariantOffer = (
    apiVariantId: number | undefined,
  ): CustomerOfferDetail | undefined =>
    offers.find(offer => {
      const variantIds = offer.variantIds;
      if (!Array.isArray(variantIds) || variantIds.length === 0) return true;
      return apiVariantId != null && variantIds.includes(apiVariantId);
    });

  // ── Real pack-size variant quantities (one independent stepper per
  // row) ─────────────────────────────────────────────────────────────────

  const setVariantQty = (variantId: string, next: number) => {
    setVariantQtys(prev => ({ ...prev, [variantId]: Math.max(next, 0) }));
  };

  // ── Custom-quantity (quantity-choices) stepper handlers ───────────────

  const quantityRule = quantityChoicesQuery.data?.quantityRule;
  const atMaxQty =
    quantityRule != null && customQty >= quantityRule.maxQty - 1e-9;

  const handleCustomQtyAdd = () => {
    if (!quantityRule) return;
    setCustomQty(quantityRule.minQty);
  };
  const handleCustomQtyIncrement = () => {
    if (!quantityRule) return;
    setCustomQty(prev => {
      const next = roundToStep(
        prev + quantityRule.stepQty,
        quantityRule.stepQty,
      );
      return Math.min(next, quantityRule.maxQty);
    });
  };
  const handleCustomQtyDecrement = () => {
    if (!quantityRule) return;
    setCustomQty(prev => {
      const next = roundToStep(
        prev - quantityRule.stepQty,
        quantityRule.stepQty,
      );
      return next < quantityRule.minQty ? 0 : next;
    });
  };
  const handleQuickOptionSelect = (choiceQty: number) => {
    // Adds the chip's weight ON TOP of whatever's already picked (capped
    // at maxQty) - this used to REPLACE `customQty` outright, which read
    // as "jump to this weight" instead of "add this much more", the
    // wrong semantics (a chip is a shortcut for tapping "+" a bunch of
    // times, not an alternative single pick).
    setCustomQty(prev => {
      const next = quantityRule
        ? roundToStep(prev + choiceQty, quantityRule.stepQty)
        : prev + choiceQty;
      return quantityRule ? Math.min(next, quantityRule.maxQty) : next;
    });
  };

  const total = useMemo(() => {
    if (optionsMode === 'quantity-choices') {
      const qc = quantityChoicesQuery.data;
      const finalRate = qc?.finalUnitRate ?? qc?.unitRate ?? 0;
      return roundMoney(finalRate * customQty);
    }
    // Sum of every picked row's backend-final price x its own quantity.
    return roundMoney(
      (activeVariants ?? []).reduce(
        (sum, variant) => sum + variant.price * (variantQtys[variant.id] ?? 0),
        0,
      ),
    );
  }, [
    optionsMode,
    quantityChoicesQuery.data,
    customQty,
    activeVariants,
    variantQtys,
  ]);

  // A real pack-size variant is always its own separate cart line - one
  // `onAddToCart` call per row picked, same as before. A custom-quantity
  // product is NOT a separate SKU per amount picked - it's the same
  // underlying product/variant, just a different weight of it - so
  // there's only ever ONE cart line, built directly from the stepper's
  // current `customQty` and the backend's own `unitRate`/`finalUnitRate`
  // (a given final rate scaled by a chosen quantity - not a new discount
  // derivation, same category as this sheet's own `total` footer above).
  const handleDoneOptions = () => {
    if (optionsMode === 'quantity-choices') {
      if (customQty <= 0) {
        setSheetVisible(false);
        return;
      }
      const qc = quantityChoicesQuery.data;
      const unitRate = qc?.unitRate ?? 0;
      const finalUnitRate = qc?.finalUnitRate ?? unitRate;
      const unitShortCode = qc?.pricingUom?.shortCode ?? '';
      const totalPrice = roundMoney(finalUnitRate * customQty);
      const totalMrp = roundMoney(unitRate * customQty);

      onAddToCart?.(
        product,
        {
          id: product.id,
          label: `${formatQty(customQty)} ${unitShortCode}`.trim(),
          price: totalPrice,
          mrp: totalMrp > totalPrice ? totalMrp : undefined,
          isDefault: false,
          // One cart line regardless of how the shopper landed on this
          // quantity (stepper taps and/or a quick-select pick) - see
          // `ProductVariant`'s own comment and `cartStore.ts`'s
          // `setCustomQuantityLine`.
          isCustomQuantitySelection: true,
          // A UNIT_RATE product has no separate SKU per amount picked -
          // it always prices off the SAME `defaultVariant`.
          apiVariantId: qc?.defaultVariant?.variantId,
          apiBaseQty: customQty,
          // Cached onto the cart line so its own +/- stepper can enforce
          // the SAME min/max/step rule without re-fetching it - see
          // `cartStore.ts`'s `CartItem.quantityRule`.
          quantityRule,
          pricingUnitLabel: unitShortCode,
        },
        1,
      );
      setSheetVisible(false);
      return;
    }

    // Every pack size is its own cart line: apply each row that changed
    // since the sheet opened - added/updated rows go through
    // `onAddToCart` (absolute quantity, see `addVariantLine`), rows the
    // shopper stepped back down to 0 are removed from the cart.
    for (const variant of activeVariants ?? []) {
      const qty = variantQtys[variant.id] ?? 0;
      const lineId = `${product.id}:${variant.id}`;
      const inCart = cartItems.find(item => item.id === lineId);
      if (qty > 0) {
        if (inCart?.quantity !== qty) onAddToCart?.(product, variant, qty);
      } else if (inCart) {
        removeCartItem(lineId);
      }
    }
    setSheetVisible(false);
  };

  const sheetFooter = (
    <View style={styles.sheetFooter}>
      <View style={styles.sheetFooterTotalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>₹{total}</Text>
      </View>
      <Button
        title="Add Cart"
        onPress={handleDoneOptions}
        fullWidth
        style={styles.doneBtn}
      />
    </View>
  );

  // Custom-quantity card's own live price preview - shows the price for
  // whatever is currently picked, or (while still at "ADD") for the
  // smallest step, so the card never shows a bare ₹0 before anything's
  // chosen. Still backend-rate × quantity only, same as `total` above.
  const qcData = quantityChoicesQuery.data;
  const customQtyDisplayQty =
    customQty > 0 ? customQty : quantityRule?.minQty ?? 1;
  const customQtyUnitRate = qcData?.unitRate ?? 0;
  const customQtyFinalRate = qcData?.finalUnitRate ?? customQtyUnitRate;
  const customQtyFinalPrice = roundMoney(
    customQtyFinalRate * customQtyDisplayQty,
  );
  const customQtyBeforePrice = roundMoney(
    customQtyUnitRate * customQtyDisplayQty,
  );
  const customQtyOffer = resolveVariantOffer(qcData?.defaultVariant?.variantId);
  const customQtyOfferPercent =
    customQtyOffer?.discountType === 'PERCENT' &&
    typeof customQtyOffer.discountValue === 'number'
      ? customQtyOffer.discountValue
      : undefined;

  return (
    <>
      <Pressable
        style={
          triggerVariant === 'fullWidth'
            ? styles.optionsBtnFull
            : styles.optionsBtn
        }
        onPress={() => setSheetVisible(true)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Choose options for ${baseName}`}
      >
        {triggerVariant === 'fullWidth' ? (
          <Text style={styles.optionsBtnFullText}>Choose qty</Text>
        ) : (
          <>
            <Text style={styles.optionsBtnText}>
              {optionCount} {optionCount === 1 ? 'Option' : 'Options'}
            </Text>
            <ChevronDown color={colors.primary} size={13} strokeWidth={2.5} />
          </>
        )}
      </Pressable>

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={baseName}
        footer={sheetFooter}
      >
        {optionsMode === 'quantity-choices' ? (
          qcData == null ? (
            optionsError ? (
              <View style={styles.sheetStateWrap}>
                <Text style={styles.sheetStateText}>
                  Couldn't load options.
                </Text>
                <Pressable onPress={() => refetchOptions()}>
                  <Text style={styles.sheetRetryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.sheetStateWrap}>
                <Loader />
              </View>
            )
          ) : (
            <>
              <View style={styles.variantRow}>
                <View style={styles.variantImageBox}>
                  <AppImage
                    source={{ uri: product.imageUri }}
                    style={styles.variantImage}
                    resizeMode="contain"
                  />
                  {customQtyOffer ? (
                    <OfferBadge
                      percent={customQtyOfferPercent}
                      label={
                        customQtyOfferPercent == null
                          ? customQtyOffer.label
                          : undefined
                      }
                      style={styles.variantOfferBadge}
                    />
                  ) : null}
                </View>

                <View style={styles.variantInfo}>
                  <Text
                    style={styles.variantLabel}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {baseName}
                  </Text>
                  <PriceStack
                    price={customQtyFinalPrice}
                    beforePrice={customQtyBeforePrice}
                    size="md"
                    style={styles.variantPriceStack}
                  />
                </View>

                {customQty === 0 ? (
                  <Pressable
                    style={styles.addBtn}
                    onPress={handleCustomQtyAdd}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${baseName}`}
                  >
                    <Text style={styles.addBtnText}>ADD</Text>
                  </Pressable>
                ) : (
                  <View style={styles.stepper}>
                    <Pressable
                      style={styles.stepperBtn}
                      hitSlop={8}
                      onPress={handleCustomQtyDecrement}
                    >
                      <Minus
                        color={colors.primary}
                        size={14}
                        strokeWidth={2.5}
                      />
                    </Pressable>
                    <Text style={styles.stepperQty} numberOfLines={1}>
                      {formatQty(customQty)}{' '}
                      {qcData.pricingUom?.shortCode ?? ''}
                    </Text>
                    <Pressable
                      style={[
                        styles.stepperBtn,
                        atMaxQty && styles.stepperBtnDisabled,
                      ]}
                      hitSlop={8}
                      disabled={atMaxQty}
                      onPress={handleCustomQtyIncrement}
                    >
                      <Plus
                        color={atMaxQty ? colors.textSecondary : colors.primary}
                        size={14}
                        strokeWidth={2.5}
                      />
                    </Pressable>
                  </View>
                )}
              </View>

              {qcData.choices.length > 0 ? (
                <View style={styles.quickOptionsWrap}>
                  <Text style={styles.quickOptionsLabel}>Quick select</Text>
                  <View style={styles.quickOptionsRow}>
                    {qcData.choices.map(choice => {
                      const selected =
                        Math.abs(customQty - choice.quantity) < 1e-6;
                      return (
                        <Pressable
                          key={choice.quantityChoiceId}
                          style={[
                            styles.quickOptionChip,
                            selected && styles.quickOptionChipSelected,
                          ]}
                          onPress={() =>
                            handleQuickOptionSelect(choice.quantity)
                          }
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                        >
                          <Text
                            style={[
                              styles.quickOptionChipText,
                              selected && styles.quickOptionChipTextSelected,
                            ]}
                          >
                            {choice.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </>
          )
        ) : activeVariants === null ? (
          optionsError ? (
            <View style={styles.sheetStateWrap}>
              <Text style={styles.sheetStateText}>Couldn't load options.</Text>
              <Pressable onPress={() => refetchOptions()}>
                <Text style={styles.sheetRetryText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sheetStateWrap}>
              <Loader />
            </View>
          )
        ) : activeVariants.length === 0 ? (
          <View style={styles.sheetStateWrap}>
            <Text style={styles.sheetStateText}>No options available.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {activeVariants.map(variant => {
              const offer = resolveVariantOffer(variant.apiVariantId);
              const offerPercent =
                offer?.discountType === 'PERCENT' &&
                typeof offer.discountValue === 'number'
                  ? offer.discountValue
                  : undefined;
              // FLAT offers show "₹20 OFF" rather than a percentage.
              const offerAmount =
                offerPercent == null && variant.flatOffAmount != null
                  ? roundMoney(variant.flatOffAmount)
                  : undefined;

              const beforePrice =
                variant.mrp ?? variant.sellingPriceBeforeOffer;
              const beforePriceRounded =
                beforePrice != null ? roundMoney(beforePrice) : undefined;
              const unitPrice = roundMoney(variant.price);

              const qty = variantQtys[variant.id] ?? 0;

              return (
                <View key={variant.id} style={styles.variantRow}>
                  <View style={styles.variantImageBox}>
                    <AppImage
                      source={{ uri: product.imageUri }}
                      style={styles.variantImage}
                      resizeMode="contain"
                    />
                    {offer || offerAmount != null ? (
                      <OfferBadge
                        percent={offerPercent}
                        amount={offerAmount}
                        label={
                          offerPercent == null && offerAmount == null
                            ? offer?.label
                            : undefined
                        }
                        style={styles.variantOfferBadge}
                      />
                    ) : null}
                  </View>

                  <View style={styles.variantInfo}>
                    <Text
                      style={styles.variantLabel}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {variant.label}
                    </Text>
                    <PriceStack
                      price={unitPrice}
                      beforePrice={beforePriceRounded}
                      size="md"
                      inline
                      style={styles.variantPriceStack}
                    />
                  </View>

                  {qty === 0 ? (
                    <Pressable
                      style={styles.addBtn}
                      onPress={() => setVariantQty(variant.id, 1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${variant.label}`}
                    >
                      <Text style={styles.addBtnText}>ADD</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.stepper}>
                      <Pressable
                        style={styles.stepperBtn}
                        hitSlop={8}
                        onPress={() => setVariantQty(variant.id, qty - 1)}
                      >
                        <Minus
                          color={colors.primary}
                          size={14}
                          strokeWidth={2.5}
                        />
                      </Pressable>
                      <Text style={styles.stepperQty}>{qty}</Text>
                      <Pressable
                        style={styles.stepperBtn}
                        hitSlop={8}
                        onPress={() => setVariantQty(variant.id, qty + 1)}
                      >
                        <Plus
                          color={colors.primary}
                          size={14}
                          strokeWidth={2.5}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </BottomSheet>
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    optionsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs + 1,
    },
    optionsBtnText: {
      color: colors.primary,
      fontSize: 11,
      fontFamily: fonts.bold,
    },
    // Solid, card-width variant - see `triggerVariant` prop's own comment.
    optionsBtnFull: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.xs + 3,
      marginTop: spacing.xs,
    },
    optionsBtnFullText: {
      color: colors.textInverse,
      fontSize: 13,
      fontFamily: fonts.bold,
    },
    sheetStateWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    sheetStateText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    sheetRetryText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    variantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    variantImageBox: {
      width: 64,
      height: 64,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
      position: 'relative',
    },
    variantImage: {
      width: '100%',
      height: '100%',
    },
    variantOfferBadge: {
      position: 'absolute',
      top: 2,
      left: 2,
      zIndex: 1,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    variantInfo: {
      flex: 1,
    },
    variantLabel: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    variantPriceStack: {
      marginTop: 3,
    },
    addBtn: {
      minWidth: 68,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.background,
    },
    addBtnText: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    stepper: {
      minWidth: 84,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
    },
    stepperBtn: {
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperBtnDisabled: {
      opacity: 0.4,
    },
    stepperQty: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      paddingHorizontal: 2,
    },
    quickOptionsWrap: {
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
    },
    quickOptionsLabel: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    quickOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    quickOptionChip: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.background,
    },
    quickOptionChipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    quickOptionChipText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
    },
    quickOptionChipTextSelected: {
      color: colors.textInverse,
    },
    sheetFooter: {
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    sheetFooterTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    totalLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: fonts.medium,
    },
    totalAmount: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    doneBtn: {
      minHeight: 44,
    },
  });
}
