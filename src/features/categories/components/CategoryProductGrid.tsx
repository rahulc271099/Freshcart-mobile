import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ProductCard, type Product, type ProductVariant } from '@/components';
import { spacing } from '@/theme';

export interface CategoryProductGridProps {
  products: Product[];
  onAddToCart: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => void;
  /** A shopper tapped a card (not its "Options"/"ADD" control) - opens
   * Product Details. Was previously never wired up at all: `ProductCard`
   * supports an `onPress` prop, but this grid never passed one through,
   * so tapping a card here did nothing. */
  onProductPress: (product: Product) => void;
  /** Extra bottom padding so the last row can clear the floating tab bar
   * (and CartBar, when visible) - same reasoning as CategorySidebar's. */
  bottomPadding: number;
}

/**
 * Categories screen's 2-column product grid. On the screen's main white
 * background; cards stay visually distinct via their own border/shadow
 * rather than a background-color shift. Uses the same shared `ProductCard`
 * as Home - see `@/components/ProductCard.tsx`.
 */
export function CategoryProductGrid({
  products,
  onAddToCart,
  onProductPress,
  bottomPadding,
}: CategoryProductGridProps) {
  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.item}>
        <ProductCard
          product={item}
          onAddToCart={onAddToCart}
          onPress={onProductPress}
        />
      </View>
    ),
    [onAddToCart, onProductPress],
  );

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.id}
      numColumns={2}
      renderItem={renderProduct}
      // `flex: 1` on each item stretches a lone odd-item-out in the final
      // row to fill the whole row width (nothing to share the flex with).
      // A fixed percentage width plus `space-between` on the row itself
      // keeps every card the same size regardless of how the last row
      // fills up.
      columnWrapperStyle={styles.row}
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
  row: {
    justifyContent: 'space-between',
  },
  item: {
    width: '48%',
    marginBottom: spacing.sm,
  },
});
