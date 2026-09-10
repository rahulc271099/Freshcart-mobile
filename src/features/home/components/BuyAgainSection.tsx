import React from 'react';

import { ProductSection } from './ProductSection';
import type { Product } from './ProductCard';

interface BuyAgainSectionProps {
  /** Products from the user's real purchase history. Empty for new users
   * with no order history - this component renders nothing in that case
   * rather than falling back to generic/unrelated products, per the "no
   * fake personalization" rule: don't show "Buy Again" until there's real
   * behavioral data to back it. */
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onProductPress?: (product: Product) => void;
  onViewAll?: () => void;
}

/**
 * Thin conditional wrapper around `ProductSection` - reuses the exact same
 * product-card UI as every other Home section (no new card design), and
 * simply doesn't render when there's no purchase history yet.
 *
 * IMPORTANT: HomeScreen currently passes `BUY_AGAIN_EXAMPLE` (dummy data)
 * here so the section is visible as a demo/example, per explicit request.
 * There's still no real orders/purchase-history feature behind this - wire
 * `products` to that once it exists, or pass `[]` so this correctly
 * disappears for users with no real order history, same as it did before
 * the demo data was added.
 */
export function BuyAgainSection({
  products,
  onAddToCart,
  onProductPress,
  onViewAll,
}: BuyAgainSectionProps) {
  if (products.length === 0) return null;

  return (
    <ProductSection
      title="Buy Again"
      products={products}
      onAddToCart={onAddToCart}
      onProductPress={onProductPress}
      onViewAll={onViewAll}
    />
  );
}
