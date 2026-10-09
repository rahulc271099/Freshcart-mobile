import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fonts, useTheme, type ThemeColors } from '@/theme';

export interface PriceStackProps {
  /** The amount actually charged - always shown, bold, on top. */
  price: number;
  /** Shown struck-through directly below `price`, only when it's
   * genuinely higher than `price` - the "what this would cost without
   * today's offer" reference. Pass whichever of the backend's own
   * numbers is more specific for the row being shown (a variant/choice's
   * real `sellingPrice` beats the product's general `mrp` - see each
   * caller's own comment on why). */
  beforePrice?: number | null;
  size?: 'sm' | 'md';
  /** Lays the struck-through price out on the SAME row, right after the
   * charged price ("₹100 ~~₹120~~"), instead of stacked underneath. */
  inline?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<'sm' | 'md', { price: number; before: number }> = {
  sm: { price: 14, before: 12 },
  md: { price: 15, before: 12 },
};

/**
 * Vertical price stack used everywhere a product/variant/quantity-choice
 * shows its price: the real amount charged on top, and - only when the
 * backend reports a genuinely higher reference price - that reference
 * price struck through directly underneath. Nothing here computes a
 * discount; both numbers always come straight from the backend (see
 * `ProductCard`'s/`ProductOptionsSheet`'s own callers for exactly which
 * backend fields feed `price`/`beforePrice`).
 */
export function PriceStack({
  price,
  beforePrice,
  size = 'sm',
  inline = false,
  style,
}: PriceStackProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sizes = SIZES[size];
  const showBefore = beforePrice != null && beforePrice > price;

  return (
    <View style={[styles.wrap, inline && styles.wrapInline, style]}>
      <Text style={[styles.price, { fontSize: sizes.price }]}>₹{price}</Text>
      {showBefore ? (
        <Text
          style={[
            styles.before,
            inline && styles.beforeInline,
            { fontSize: sizes.before },
          ]}
        >
          ₹{beforePrice}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    wrapInline: {
      flexDirection: 'row',
      alignItems: 'baseline',
      flexWrap: 'wrap',
      columnGap: 6,
    },
    price: {
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    before: {
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
      marginTop: 1,
    },
    beforeInline: {
      marginTop: 0,
    },
  });
}
