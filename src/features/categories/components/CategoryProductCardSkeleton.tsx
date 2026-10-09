import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components';
import { radius, spacing, useTheme, type ThemeColors } from '@/theme';

const IMAGE_ASPECT_RATIO = 1;
// Mirrors ProductCard's own `NAME_HEIGHT` (2 lines @ 17 lineHeight) so
// this placeholder's info section takes up the same vertical space the
// real card's name does.
const NAME_HEIGHT = 34;

/**
 * Placeholder matching the shared `ProductCard`'s CURRENT layout exactly
 * (square image, divider, name, then a single price+options row) - see
 * `@/components/ProductCard.tsx`'s own `createStyles`. `CategoryProductGridSkeleton`
 * places these in the same 2-column/48%-width arrangement
 * `CategoryProductGrid` itself uses, so nothing shifts when real cards
 * swap in. Kept as its own component (rather than reusing Home's
 * `ProductCardSkeleton`) because that one is shaped for a fixed-width
 * HORIZONTAL list, not this 2-column grid - different card width, no
 * options-row silhouette, wrong spacing.
 */
export function CategoryProductCardSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      {/* `aspectRatio` on the wrapper (not a fixed pixel height) matches
          ProductCard's own `imageWrap` exactly - the Skeleton inside is
          absolutely filled to it rather than given its own `height` prop,
          so it's correctly square at any column width. */}
      <View style={styles.imageWrap}>
        <Skeleton width="100%" style={styles.imageFill} borderRadius={0} />
      </View>
      <View style={styles.divider} />
      <View style={styles.info}>
        <View style={styles.nameWrap}>
          <Skeleton width="90%" height={13} />
          <Skeleton width="55%" height={13} />
        </View>
        <View style={styles.priceRow}>
          <Skeleton width={40} height={16} />
          <Skeleton width={64} height={26} borderRadius={radius.sm} />
        </View>
      </View>
    </View>
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
    },
    imageWrap: {
      width: '100%',
      aspectRatio: IMAGE_ASPECT_RATIO,
      backgroundColor: colors.surface,
    },
    imageFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
    nameWrap: {
      height: NAME_HEIGHT,
      justifyContent: 'center',
      gap: 6,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      minHeight: 18,
    },
  });
}
