import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components';
import { radius, spacing, useTheme, type ThemeColors } from '@/theme';

const IMAGE_SIZE = 72;

/** Matches `CartItemRow`'s own layout (image, name, price, stepper) -
 * swapped in while the cart's first server sync is still in flight (see
 * `cartStore.ts`'s `isHydrating`), so the screen doesn't flash a bare
 * empty state before the real lines arrive. */
function CartItemRowSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Skeleton width={IMAGE_SIZE} height={IMAGE_SIZE} borderRadius={radius.md} />
      <View style={styles.info}>
        <Skeleton width="60%" height={15} />
        <Skeleton width="35%" height={13} style={styles.gapTop} />
      </View>
      <Skeleton width={84} height={30} borderRadius={radius.md} />
    </View>
  );
}

/** Whole-screen placeholder for `CartScreen` - a few item rows plus a
 * price-details-shaped block, so the loading state reads as "your cart is
 * loading", not "your cart is empty" (those are very different things to
 * a shopper, and used to be indistinguishable here). */
export function CartScreenSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.items}>
        {[0, 1, 2].map(i => (
          <CartItemRowSkeleton key={i} />
        ))}
      </View>

      <View style={styles.priceCard}>
        <Skeleton width="40%" height={16} style={styles.gapTop} />
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={styles.priceRow}>
            <Skeleton width="35%" height={13} />
            <Skeleton width={48} height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
    items: {
      gap: spacing.sm,
    },
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
    info: {
      flex: 1,
    },
    gapTop: {
      marginTop: spacing.sm,
    },
    priceCard: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
  });
}
