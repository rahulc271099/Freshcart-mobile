import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Minus, Plus } from 'lucide-react-native';

import { OfferBadge } from '@/components';
import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type { CartLine } from '../types/cart.types';

const IMAGE_SIZE = 92;

interface CartItemRowProps {
  line: CartLine;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

/**
 * One line in the cart - image, name/unit/price/savings, a quantity
 * stepper, and the line's running total. The stepper calls back with just
 * the product id; the screen (which already has `lines` in scope) decides
 * the next quantity via `useCartItems().updateQuantity` - keeps this
 * component free of cart-store knowledge, same as `ProductCard`/
 * `CategoryProductCard` staying free of it for "add to cart".
 */
export function CartItemRow({
  line,
  onIncrement,
  onDecrement,
}: CartItemRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const savings = line.originalPrice - line.price;
  const discountPercent =
    savings > 0 ? Math.round((savings / line.originalPrice) * 100) : 0;
  const lineTotal = line.price * line.quantity;

  return (
    <View style={styles.card}>
      {/* ── Image ──────────────────────────────────────── */}
      <View style={styles.imageWrap}>
        {discountPercent > 0 && (
          <OfferBadge percent={discountPercent} style={styles.discountBadge} />
        )}
        <Image
          source={{ uri: line.imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
        {/* Decorative "in cart" indicator, matching the reference UI - not
            an item-selection toggle (nothing in this cart can be excluded
            from checkout individually yet). */}
        <View style={styles.checkBadge}>
          <Check color={colors.textInverse} size={11} strokeWidth={3} />
        </View>
      </View>

      {/* ── Info ───────────────────────────────────────── */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {line.name}
        </Text>
        <Text style={styles.unit}>{line.unit}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{line.price}</Text>
          {savings > 0 && (
            <Text style={styles.originalPrice}>₹{line.originalPrice}</Text>
          )}
        </View>
        {savings > 0 && (
          <Text style={styles.savings}>
            You save ₹{savings} ({discountPercent}%)
          </Text>
        )}

        <View style={styles.bottomRow}>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onDecrement(line.id)}
              hitSlop={8}
              accessibilityLabel={`Remove one ${line.name}`}
            >
              <Minus color={colors.primary} size={14} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.qty}>{line.quantity}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => onIncrement(line.id)}
              hitSlop={8}
              accessibilityLabel={`Add one more ${line.name}`}
            >
              <Plus color={colors.primary} size={14} strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text style={styles.lineTotal}>₹{lineTotal}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: spacing.sm,
      ...shadows.sm,
    },
    imageWrap: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    discountBadge: {
      position: 'absolute',
      top: spacing.xs,
      left: spacing.xs,
      zIndex: 1,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    checkBadge: {
      position: 'absolute',
      bottom: spacing.xs,
      left: spacing.xs,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      borderWidth: 1.5,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    unit: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    price: {
      fontSize: 16,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    originalPrice: {
      fontSize: 12,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    savings: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.success,
      marginTop: 1,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
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
    lineTotal: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
  });
}
