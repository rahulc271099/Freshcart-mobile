import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';
import {
  CategoryProductCard,
  type CategoryProduct,
} from './CategoryProductCard';

export interface CategoryProductGridProps {
  products: CategoryProduct[];
  onAddToCart: (product: CategoryProduct) => void;
  /** Extra bottom padding so the last row can clear the floating tab bar
   * (and CartBar, when visible) - same reasoning as CategorySidebar's. */
  bottomPadding: number;
}

/**
 * Categories screen's 2-column product grid. On the screen's main white
 * background; cards stay visually distinct via their own border/shadow
 * rather than a background-color shift.
 */
export function CategoryProductGrid({
  products,
  onAddToCart,
  bottomPadding,
}: CategoryProductGridProps) {
  const renderProduct = useCallback(
    ({ item, index }: { item: CategoryProduct; index: number }) => (
      <View style={[styles.item, index % 2 === 0 && styles.itemLeft]}>
        <CategoryProductCard product={item} onAddToCart={onAddToCart} />
      </View>
    ),
    [onAddToCart],
  );

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id}
      numColumns={2}
      renderItem={renderProduct}
      contentContainerStyle={[styles.grid, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

// No color tokens used - this is layout-only, so (unlike most `createStyles`
// factories in this codebase) a plain static StyleSheet is enough; no need
// to rebuild it per theme change.
const styles = StyleSheet.create({
  grid: {
    padding: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  item: {
    flex: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  itemLeft: {
    marginLeft: 0,
    marginRight: spacing.xs,
  },
});
