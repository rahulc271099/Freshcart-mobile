import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductCard, type Product, type ProductVariant } from '@/components';
import {
  fonts,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';

// The shared `ProductCard` (see `@/components/ProductCard.tsx`) is
// width-agnostic (`flex: 1`) so it also works inside Categories'/Search's
// 2-column grids - this section is what pins it to a fixed width for its
// own horizontal scrolling list, same role `CARD_WIDTH` played on the old
// Home-only card.
const CARD_WIDTH = 152;

interface ProductSectionProps {
  title: string;
  subtitle?: string | null;
  products: Product[];
  onViewAll?: () => void;
  onAddToCart?: (
    product: Product,
    variant: ProductVariant,
    quantity: number,
  ) => void;
  onProductPress?: (product: Product) => void;
}

export function ProductSection({
  title,
  subtitle,
  products,
  onViewAll,
  onAddToCart,
  onProductPress,
}: ProductSectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onViewAll ? (
          <Pressable
            onPress={onViewAll}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`See all ${title}`}
          >
            <Text style={styles.viewAll}>See all ›</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Horizontal product list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {products.map(p => (
          <View key={p.id} style={styles.cardWrap}>
            <ProductCard
              product={p}
              onAddToCart={onAddToCart}
              onPress={onProductPress}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    titleGroup: {
      flex: 1,
      marginRight: spacing.sm,
    },
    title: {
      ...typography.heading3,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    viewAll: {
      fontSize: 13,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      paddingTop: spacing.xs,
    },
    cardWrap: {
      width: CARD_WIDTH,
      marginRight: spacing.sm,
    },
  });
}
