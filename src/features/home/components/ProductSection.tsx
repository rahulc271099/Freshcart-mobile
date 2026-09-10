import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  fonts,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';
import { ProductCard, type Product } from './ProductCard';

interface ProductSectionProps {
  title: string;
  products: Product[];
  onViewAll?: () => void;
  onAddToCart?: (product: Product) => void;
  onProductPress?: (product: Product) => void;
}

export function ProductSection({
  title,
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
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={styles.viewAll}>View all ›</Text>
        </Pressable>
      </View>

      {/* Horizontal product list */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {products.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onAddToCart={onAddToCart}
            onPress={onProductPress}
          />
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
    title: {
      ...typography.heading3,
      color: colors.textPrimary,
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
  });
}
