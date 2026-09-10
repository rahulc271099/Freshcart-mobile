import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { spacing, useTheme, type ThemeColors } from '@/theme';
import {
  CategorySidebarItem,
  type SidebarCategory,
} from './CategorySidebarItem';

export interface CategorySidebarProps {
  categories: SidebarCategory[];
  activeCategoryId: string;
  onSelect: (id: string) => void;
  /** Extra bottom padding so the last item can clear the floating tab bar
   * (and CartBar, when visible) instead of scrolling to underneath them -
   * caller computes this since it depends on navigation chrome this
   * component has no reason to know about. */
  bottomPadding: number;
}

/**
 * Categories screen's left-hand category rail. Explicitly `backgroundSec`,
 * the one section on this screen called out to use the secondary color
 * instead of the screen's main `background`.
 */
export function CategorySidebar({
  categories,
  activeCategoryId,
  onSelect,
  bottomPadding,
}: CategorySidebarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.sidebar}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
    >
      {categories.map(cat => (
        <CategorySidebarItem
          key={cat.id}
          category={cat}
          isActive={activeCategoryId === cat.id}
          onPress={onSelect}
        />
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
  });
}
