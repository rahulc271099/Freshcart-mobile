import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

/**
 * Categories screen's filter row. This is a fruits/vegetables-only app -
 * "Brands" and "Sort By" (and the standalone filter/sliders icon buttons
 * that opened a general filter panel) don't apply here, so this is
 * deliberately just the one relevant pill rather than a generic
 * e-commerce filter bar. TODO: wire real "price drop" filtering once that
 * exists.
 */
export function CategoryFilterBar() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.bar}>
      <Pressable style={styles.priceDropChip}>
        <Text style={styles.priceDropEmoji}>🔥</Text>
        <Text style={styles.priceDropText}>Price Drop</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    priceDropChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: '#FFF3E0',
      borderColor: '#FFCC80',
    },
    priceDropEmoji: {
      fontSize: 11,
    },
    priceDropText: {
      fontSize: 11,
      color: '#E65100',
      fontFamily: fonts.semiBold,
    },
  });
}
