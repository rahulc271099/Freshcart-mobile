import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components';
import { radius, spacing, useTheme, type ThemeColors } from '@/theme';

// Matches `ProductSection`'s own `CARD_WIDTH` and the shared `ProductCard`'s
// square (aspectRatio: 1) image block, so the swap to real content doesn't
// shift layout.
const CARD_WIDTH = 152;

/** Placeholder matching the shared `ProductCard`'s own dimensions/sections
 * (image, divider, top row, name, price) - see `@/components/ProductCard`. */
export function ProductCardSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={CARD_WIDTH} borderRadius={0} />
      <View style={styles.divider} />
      <View style={styles.info}>
        <Skeleton
          width={64}
          height={22}
          borderRadius={999}
          style={styles.topRow}
        />
        <Skeleton width="80%" height={12} style={styles.gapTop} />
        <Skeleton width="50%" height={14} style={styles.gapTop} />
      </View>
    </View>
  );
}

/** A horizontal row of `ProductCardSkeleton`s, matching `ProductSection`'s
 * own horizontal list layout - swapped in during HomeScreen's brief
 * simulated initial load. */
export function ProductSectionSkeleton() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {[0, 1, 2, 3].map(i => (
        <ProductCardSkeleton key={i} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
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
    topRow: {
      alignSelf: 'flex-end',
    },
    gapTop: {
      marginTop: spacing.xs,
    },
  });
}
