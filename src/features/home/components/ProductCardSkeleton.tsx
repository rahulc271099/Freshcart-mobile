import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components';
import { radius, shadows, spacing, useTheme, type ThemeColors } from '@/theme';

const CARD_WIDTH = 130;
const IMAGE_HEIGHT = 110;

/** Placeholder matching `ProductCard`'s own dimensions, so the swap to real
 * content doesn't shift layout. */
export function ProductCardSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={IMAGE_HEIGHT} borderRadius={0} />
      <View style={styles.info}>
        <Skeleton width="80%" height={12} />
        <Skeleton width="50%" height={12} style={styles.gapTop} />
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
      ...shadows.sm,
    },
    info: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    gapTop: {
      marginTop: spacing.xs,
    },
  });
}
