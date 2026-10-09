import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';
import { CategoryProductCardSkeleton } from './CategoryProductCardSkeleton';

const PLACEHOLDER_COUNT = 6;

/**
 * Matches `CategoryProductGrid`'s own container exactly - same
 * `padding: spacing.sm`, same 2-column/48%-width/`space-between` row
 * layout (its `FlatList` gets this via `columnWrapperStyle`+`numColumns`;
 * a plain wrapped `View` reaches the identical result with
 * `flexWrap: 'wrap'` + `justifyContent: 'space-between'` since there's no
 * list virtualization to worry about for 6 static placeholders) - so
 * nothing shifts/reflows when real cards swap in. Shown only for this
 * screen's very first product fetch - see `CategoriesScreen`'s own
 * comment on why a later group switch never shows this.
 */
export function CategoryProductGridSkeleton() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.grid}
    >
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <View key={index} style={styles.item}>
          <CategoryProductCardSkeleton />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  item: {
    width: '48%',
    marginBottom: spacing.sm,
  },
});
