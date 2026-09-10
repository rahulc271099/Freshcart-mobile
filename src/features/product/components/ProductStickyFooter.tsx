import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components';
import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

interface ProductStickyFooterProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

/**
 * Product Details' bottom action bar: quantity stepper (bound directly to
 * the real cart, same as `ProductCard`'s own stepper) + Add to Cart +
 * Buy Now. Distinct from `CartBar` (that's a floating cart-summary pill
 * shown on Home/Categories) - this is a screen-anchored footer with a
 * different job, so it's its own component rather than a CartBar reuse.
 */
export function ProductStickyFooter({
  quantity,
  onIncrement,
  onDecrement,
  onAddToCart,
  onBuyNow,
}: ProductStickyFooterProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}
    >
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          onPress={onDecrement}
          hitSlop={8}
          accessibilityLabel="Decrease quantity"
        >
          <Minus color={colors.primary} size={16} strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.stepValue}>{quantity}</Text>
        <Pressable
          style={styles.stepBtn}
          onPress={onIncrement}
          hitSlop={8}
          accessibilityLabel="Increase quantity"
        >
          <Plus color={colors.primary} size={16} strokeWidth={2.5} />
        </Pressable>
      </View>

      <Button
        title="Add to Cart"
        variant="outline"
        onPress={onAddToCart}
        style={styles.actionBtn}
      />
      <Button title="Buy Now" onPress={onBuyNow} style={styles.actionBtn} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      ...shadows.md,
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: 84,
      height: 44,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xs + 2,
    },
    stepBtn: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepValue: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    actionBtn: {
      flex: 1,
    },
  });
}
