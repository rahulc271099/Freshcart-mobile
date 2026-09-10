import React from 'react';

import { ProductSection } from './ProductSection';
import type { Product } from './ProductCard';

interface RecommendedSectionProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onProductPress?: (product: Product) => void;
  onViewAll?: () => void;
}

/**
 * "Recommended for You" - same rule as `BuyAgainSection`: renders nothing
 * without real behavioral data (previous purchases, viewed products, search
 * history, wishlist, frequently-bought categories). Per the spec this
 * should NOT appear for new users, and generic/fake personalization should
 * be avoided entirely.
 *
 * IMPORTANT: HomeScreen currently passes `RECOMMENDED_EXAMPLE` (dummy data)
 * here so the section is visible as a demo/example, per explicit request.
 * There is no real recommendation engine behind this yet - before shipping,
 * either wire `products` to a real signal-driven source or pass `[]` so
 * this correctly disappears for users without enough behavioral data.
 */
export function RecommendedSection({
  products,
  onAddToCart,
  onProductPress,
  onViewAll,
}: RecommendedSectionProps) {
  if (products.length === 0) return null;

  return (
    <ProductSection
      title="Recommended for You"
      products={products}
      onAddToCart={onAddToCart}
      onProductPress={onProductPress}
      onViewAll={onViewAll}
    />
  );
}
