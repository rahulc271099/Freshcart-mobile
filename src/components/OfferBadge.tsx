import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fonts, radius, useTheme, type ThemeColors } from '@/theme';

export interface OfferBadgeProps {
  /** Discount percentage, e.g. 5 renders "5% / OFF". */
  percent: number;
  /**
   * Positioning is left to the caller (e.g. `position: 'absolute', top, left`
   * over a product image) - this component only owns its own look, same as
   * the rest of `components/` (Button, Header, ...) staying out of layout
   * decisions that belong to the screen/card using it.
   */
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Small discount tag used on product cards - a compact, uniformly-rounded
 * chip (not the "ribbon corner" shape some earlier cards used). Shared by
 * `features/home` and `features/categories` product cards so both read as
 * the same design instead of two divergent badge implementations.
 */
export function OfferBadge({ percent, style, testID }: OfferBadgeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.badge, style]} testID={testID}>
      <Text style={styles.percent}>{percent}%</Text>
      <Text style={styles.off}>OFF</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    percent: {
      color: colors.textInverse,
      fontSize: 10,
      fontFamily: fonts.bold,
      lineHeight: 12,
    },
    off: {
      color: colors.textInverse,
      fontSize: 8,
      fontFamily: fonts.semiBold,
      lineHeight: 10,
    },
  });
}
