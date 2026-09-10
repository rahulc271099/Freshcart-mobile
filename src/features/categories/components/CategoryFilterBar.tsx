import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, Filter, SlidersHorizontal } from 'lucide-react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

/**
 * Categories screen's filter row - two standalone icon buttons bookending a
 * scrollable row of filter pills. Currently static/non-interactive (the
 * pills and icon buttons don't yet do anything - same as before this was
 * split out), matching the reference layout. TODO: wire real sort/filter
 * behavior once that exists.
 */
export function CategoryFilterBar() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.bar}>
      <Pressable style={styles.iconBtn} hitSlop={4}>
        <SlidersHorizontal
          color={colors.textPrimary}
          size={16}
          strokeWidth={2}
        />
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable style={styles.chip}>
          <Text style={styles.chipText}>Sort By</Text>
          <ChevronDown color={colors.textPrimary} size={12} />
        </Pressable>

        <Pressable style={[styles.chip, styles.priceDropChip]}>
          <Text style={styles.priceDropEmoji}>🔥</Text>
          <Text style={styles.priceDropText}>Price Drop</Text>
        </Pressable>

        <Pressable style={styles.chip}>
          <Text style={styles.chipText}>Brands</Text>
          <ChevronDown color={colors.textPrimary} size={12} />
        </Pressable>
      </ScrollView>

      <Pressable style={styles.iconBtn} hitSlop={4}>
        <Filter color={colors.textPrimary} size={16} strokeWidth={2} />
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
      gap: spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.background,
    },
    chipText: {
      fontSize: 11,
      color: colors.textPrimary,
      fontFamily: fonts.medium,
    },
    priceDropChip: {
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
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
