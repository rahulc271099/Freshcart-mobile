import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';

import { AppImage } from '@/components';
import {
  fonts,
  radius,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type { CartLine } from '../types/cart.types';

const IMAGE_SIZE = 72;

interface CartItemRowProps {
  line: CartLine;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  /** Reopens the full options sheet for this line's product (via
   * `line.productId`) - for jumping straight to a different pack size/
   * weight instead of tapping the stepper repeatedly. Removed for a
   * while (see this file's git history); brought back because the
   * reference UI for the custom-quantity stepper fix shows it sitting
   * right next to the stepper. */
  onChangeQty: (productId: string) => void;
}

/** Rounds a display-only money figure to 2 decimals - used ONLY to turn a
 * custom-quantity line's own TOTAL (`price`) back into a per-unit rate by
 * dividing by its own `apiBaseQty` (both already backend-final numbers
 * captured at add-time) - never a new discount, same category as
 * `ProductOptionsSheet.tsx`'s own `roundMoney`. */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Trims a weight/quantity to its own shortest exact decimal form - 3
 * stays "3", 3.25 stays "3.25", never "3.00" or floating-point noise.
 * Same helper as `ProductOptionsSheet.tsx`'s own `formatQty`. */
function formatQty(value: number): string {
  return Number(value.toFixed(4)).toString();
}

/**
 * One line in the cart - image, name, this item's own price (never the
 * line's total - see `unitPrice` below), a quantity stepper, and a
 * "Change qty" link back to the full options sheet. Deliberately minimal
 * otherwise: no MRP strike, no per-row total - just enough to identify
 * the item and adjust its quantity, with the real breakdown living in
 * `PriceDetailsCard` below.
 *
 * The stepper's center value is the line's real, steppable amount - a
 * pack COUNT for a real variant, or a WEIGHT for a custom-quantity line
 * (see `stepperValue` below; `line.quantity` alone is NOT this for a
 * custom-quantity line, it's a fixed "1" - see `cartStore.ts`'s own
 * comment on `CartItem.apiBaseQty`). Both stepper buttons and the
 * "Change qty" link call back with just the product id; the screen
 * (which already has `lines`/`quantityRule` in scope) decides what the
 * next value should be and which store action applies it
 * (`useCartItems().updateQuantity` for a real variant,
 * `updateCustomQuantityAmount` for a custom-quantity line) - keeps this
 * component free of cart-store knowledge, same as `ProductCard` staying
 * free of it for "add to cart".
 */
export function CartItemRow({
  line,
  onIncrement,
  onDecrement,
  onChangeQty,
}: CartItemRowProps) {
  console.log("🚀 ~ CartItemRow ~ line:", line)
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // `line.price` is already the right "price of the item" for a real
  // pack-size variant (it's that one pack's price). For a custom-quantity
  // line it's the TOTAL for the whole chosen weight instead (e.g. ₹71.25
  // for "3 kg") - dividing by `apiBaseQty` (the real root-unit amount
  // that total represents) turns it back into the per-unit rate, so this
  // row never shows a total either way.
  const isCustomQuantity = line.apiBaseQty != null;
  const unitPrice =
    line.apiBaseQty != null && line.apiBaseQty > 0
      ? roundMoney(line.price / line.apiBaseQty)
      : line.price;

  // The stepper's own center value - a real pack-size variant shows its
  // plain pack COUNT (e.g. "2"), same as before. A custom-quantity line
  // used to show that same `quantity` field too, but `quantity` is a
  // fixed, meaningless "1" for these lines (the real amount lives in
  // `apiBaseQty` - see `cartStore.ts`'s own comment) - showing "1" there
  // and then having "+" double the whole weight was the actual bug
  // report this fixes. Shows the REAL weight instead, rebuilt from
  // `apiBaseQty` + `pricingUnitLabel` so it stays correct after the
  // stepper changes it (not frozen at whatever label was true at
  // add-time).
  const stepperValue = isCustomQuantity
    ? `${formatQty(line.apiBaseQty ?? 0)} ${line.pricingUnitLabel ?? ''}`.trim()
    : String(line.quantity);

  // Fallback to local unitPrice if finalUnitPrice is not available
  const finalPrice = line.finalUnitPrice ?? unitPrice;
  const originalPrice = line.unitPrice ?? unitPrice;
  const showCutPrice = originalPrice > finalPrice;

  return (
    <View style={styles.card}>
      {/* ── Image ──────────────────────────────────────── */}
      <View style={styles.imageWrap}>
        <AppImage
          source={{ uri: line.imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* ── Info ───────────────────────────────────────── */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
          {line.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{finalPrice}</Text>
          {showCutPrice && (
            <Text style={styles.cutPrice}>₹{originalPrice}</Text>
          )}
        </View>
      </View>

      {/* ── Stepper + "Change qty" ─────────────────────── */}
      <View style={styles.stepperCol}>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onDecrement(line.id)}
            hitSlop={8}
            accessibilityLabel={`Remove ${isCustomQuantity ? 'some of' : 'one'} ${line.name}`}
          >
            <Minus color={colors.primary} size={14} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.qty}>{stepperValue}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onIncrement(line.id)}
            hitSlop={8}
            accessibilityLabel={`Add ${isCustomQuantity ? 'more' : 'one more'} ${line.name}`}
          >
            <Plus color={colors.primary} size={14} strokeWidth={2.5} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => onChangeQty(line.productId)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Change quantity for ${line.name}`}
        >
          <Text style={styles.changeQtyLink}>Change qty</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    imageWrap: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    info: {
      flex: 1,
      gap: 2,
    },
    name: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    price: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.textSecondary,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    stepperCol: {
      alignItems: 'center',
      gap: 4,
    },
    cutPrice: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xs,
      paddingVertical: 5,
    },
    stepBtn: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    qty: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      minWidth: 14,
      textAlign: 'center',
    },
    changeQtyLink: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.primary,
    },
  });
}
