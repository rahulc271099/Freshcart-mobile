import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components';
import { radius, spacing, useTheme, type ThemeColors } from '@/theme';

const PLACEHOLDER_COUNT = 6;

/**
 * Matches `CategorySidebar`/`CategorySidebarItem`'s own layout (a 52x52
 * rounded thumbnail + a short centered label line) - shown only while
 * groups are loading for the very first time. A group switch never shows
 * this: the sidebar's own content doesn't depend on `activeGroupId`, only
 * the product grid does (see `CategoriesScreen`'s own comment on
 * `useCustomerProducts`'s `placeholderData`).
 *
 * `Skeleton`'s own fill color is `colors.backgroundSec` (see
 * `components/Skeleton.tsx`) - but this sidebar's own backdrop IS
 * `colors.backgroundSec` too (see `CategorySidebar`'s `styles.sidebar`),
 * so a plain `<Skeleton>` here would pulse the exact same color as what
 * it sits on and be invisible. Every instance below overrides its fill
 * to `colors.border` instead, which has real contrast against both
 * `background` and `backgroundSec` in both themes.
 */
export function CategorySidebarSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.sidebar}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <View key={index} style={styles.item}>
          <Skeleton
            width={52}
            height={52}
            borderRadius={radius.md}
            style={styles.fill}
          />
          <Skeleton width={40} height={9} style={[styles.fill, styles.label]} />
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sidebar: {
      maxWidth: 82,
      borderRightWidth: 1,
      borderRightColor: colors.divider,
      backgroundColor: colors.backgroundSec,
    },
    content: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    item: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.xs,
    },
    fill: {
      backgroundColor: colors.border,
    },
    label: {
      marginTop: spacing.xs,
    },
  });
}
