import { useCallback } from 'react';

import type { Product, ProductVariant } from '@/components';
import { useCartStore } from '@/store/cartStore';

/**
 * Add-to-cart callback for the shared `ProductCard`'s variant sheet, which
 * does NOT mutate the cart itself - every screen using it must wire this.
 * Custom-quantity picks take the `setCustomQuantityLine` path (one line per
 * product), everything else adds a line per real variant - same split
 * Categories/Search use.
 */
export function useAddProductToCart() {
  const addVariantLine = useCartStore(state => state.addVariantLine);
  const setCustomQuantityLine = useCartStore(
    state => state.setCustomQuantityLine,
  );

  return useCallback(
    (product: Product, variant: ProductVariant, quantity: number) => {
      const shared = {
        productId: product.id,
        quantity,
        name: product.name,
        imageUri: product.imageUri,
        price: variant.price,
        originalPrice: variant.mrp,
        unit: variant.label,
        // Real catalogue variant id, so the line syncs to the cart API.
        apiVariantId: variant.apiVariantId,
      };
      if (variant.isCustomQuantitySelection) {
        setCustomQuantityLine({
          ...shared,
          apiBaseQty: variant.apiBaseQty,
          // Snapshotted so the cart screen's stepper can step this line by
          // the product's real `stepQty` - see `cartStore.ts`.
          quantityRule: variant.quantityRule,
          pricingUnitLabel: variant.pricingUnitLabel,
        });
      } else {
        addVariantLine({ ...shared, variantId: variant.id });
      }
    },
    [addVariantLine, setCustomQuantityLine],
  );
}
