import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChevronRight, ShoppingBasket } from 'lucide-react-native';

import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

export interface CartBarProps {
  /** Items currently in the cart. The bar renders nothing at 0 - no floating bar over an empty cart. */
  itemCount: number;
  /** Rupees still needed to unlock `offerLabel`. Omit or pass 0 once the offer is already unlocked. */
  remainingAmount?: number;
  /** 0-100 - how far the current cart total is toward the offer threshold. */
  progressPercent?: number;
  /** Name of the spend-based perk being unlocked, e.g. "Maxxsaver". */
  offerLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Floating cart summary bar - shows progress toward a spend-based offer plus
 * a CTA into the cart. Purely presentational, same as the rest of
 * `components/` (Button, Header, ...): the screen owns cart data (item
 * count, remaining amount, progress) and passes it in as props, whether
 * that's dummy data today or `useCartStore` + real order totals later.
 *
 * IMPORTANT: this must keep an outer `wrapper` View around the `bar`
 * Pressable - it's what supplies the gap below the pill (`paddingBottom`)
 * before the tab bar starts. Without it the pill sits flush against
 * whatever's below (no breathing room) and, combined with a same-color
 * screen background, reads as one flat edge-to-edge block instead of a
 * floating pill. Do not remove/comment it out.
 */
export function CartBar({
  itemCount,
  remainingAmount = 0,
  progressPercent = 0,
  offerLabel = 'Maxxsaver',
  onPress,
  style,
  testID,
}: CartBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (itemCount <= 0) {
    return null;
  }

  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);
  const offerUnlocked = remainingAmount <= 0;

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      <Pressable
        style={styles.bar}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View cart, ${itemCount} items`}
      >
        {offerUnlocked ? (
          <View style={styles.offerRow}>
            <Text style={styles.leafEmoji}>✅</Text>
            <Text style={styles.offerUnlockedText} numberOfLines={1}>
              {offerLabel} unlocked on this order
            </Text>
          </View>
        ) : (
          <View style={styles.offerRow}>
            <Text style={styles.leafEmoji}>🌿</Text>
            <View style={styles.offerContent}>
              <Text style={styles.offerText} numberOfLines={1}>
                Add <Text style={styles.offerAmount}>₹{remainingAmount}</Text>{' '}
                more to unlock{' '}
                <Text style={styles.offerBrand}>{offerLabel}</Text>
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${clampedProgress}%` as `${number}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.cartButton}>
          <View>
            <Text style={styles.cartButtonLabel}>CART</Text>
            <Text style={styles.cartButtonCount}>
              {itemCount} ITEM{itemCount === 1 ? '' : 'S'}
            </Text>
          </View>
          <ShoppingBasket
            color={colors.textInverse}
            size={18}
            strokeWidth={2}
          />
        </View>

        <View style={styles.chevronCircle}>
          <ChevronRight color={colors.primary} size={18} strokeWidth={2.5} />
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // The gap between the pill and whatever's below it (tab bar / screen
    // edge) - see the component doc comment above.
    wrapper: {
      paddingBottom: spacing.md,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.md,
      backgroundColor: colors.background,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: spacing.md,
      paddingRight: spacing.xs,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
      ...shadows.lg,
    },
    offerRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    leafEmoji: {
      fontSize: 16,
    },
    offerContent: {
      flex: 1,
    },
    offerText: {
      fontSize: 11,
      color: colors.textPrimary,
    },
    offerAmount: {
      color: colors.warning,
      fontFamily: fonts.bold,
    },
    offerBrand: {
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    offerUnlockedText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.primary,
      flexShrink: 1,
    },
    progressTrack: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: radius.full,
      marginTop: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: radius.full,
    },
    cartButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      paddingVertical: spacing.xs,
    },
    cartButtonLabel: {
      color: colors.textInverse,
      fontSize: 11,
      fontFamily: fonts.bold,
      letterSpacing: 0.5,
    },
    cartButtonCount: {
      color: colors.textInverse,
      fontSize: 9,
      fontFamily: fonts.medium,
    },
    chevronCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
