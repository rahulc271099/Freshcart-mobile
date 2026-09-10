import type { Product } from '@/features/home/components/ProductCard';
import { ALL_PRODUCTS } from '@/features/home/data/products';

export interface ProductWeightOption {
  id: string;
  label: string;
  price: number;
  originalPrice: number;
  /** Grams, when this option is weight-based - null for a piece/bunch
   * count option (e.g. "8 pcs"), which the custom-quantity slider can't
   * meaningfully represent. */
  grams: number | null;
}

export interface ProductDetailsData {
  description: string;
  weightOptions: ProductWeightOption[];
  /** Base quantity in grams, when `product.unit` parses as one - drives
   * the custom-quantity slider's starting point and range. Null for
   * piece/bunch-based products (e.g. "4 pcs", "1 bunch"), which get a
   * simple +/- count stepper instead - see ProductOptionsSheet. */
  baseGrams: number | null;
  similarProducts: Product[];
}

const WEIGHT_UNIT_PATTERN = /^(\d+(?:\.\d+)?)\s*(kg|g|gm|gms)\b/i;

/** Parses a leading weight like "500g" / "500 Gm" / "1kg" into grams.
 * Returns null for non-weight units ("4 pcs", "1 bunch", ...). */
function parseGrams(unit: string): number | null {
  const match = unit.trim().match(WEIGHT_UNIT_PATTERN);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const isKg = match[2].toLowerCase() === 'kg';
  return isKg ? value * 1000 : value;
}

function formatGrams(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} Kg`;
  }
  return `${Math.round(grams)} Gm`;
}

/** "4 pcs" -> "8 pcs", "1 bunch" -> "2 bunch" - doubles the leading count
 * for a non-weight unit, same idea as doubling grams for a weight one. */
function doubleCountUnit(unit: string): string {
  return unit.replace(/^(\d+)/, match => String(Number(match) * 2));
}

/**
 * PLACEHOLDER product-details data, derived from the existing `Product`
 * catalog (name/price/unit/discount%) rather than a hand-authored dataset
 * per product - there's no real product-details/variants/"similar
 * products" API yet. The second weight option mirrors the reference
 * design exactly (double the quantity at the same discount rate: e.g.
 * ₹55/500g @ 5% off -> ₹110/1kg @ 5% off). Replace with a real
 * product-details endpoint once one exists; `ProductDetailsData` is what
 * that response should map onto.
 */
export function getProductDetails(product: Product): ProductDetailsData {
  const baseGrams = parseGrams(product.unit);
  const discountPercent = product.discountPercent ?? 0;
  const originalPrice = Math.round(product.price / (1 - discountPercent / 100));

  const baseOption: ProductWeightOption = {
    id: `${product.id}-base`,
    label: product.unit,
    price: product.price,
    originalPrice,
    grams: baseGrams,
  };

  const secondOption: ProductWeightOption = {
    id: `${product.id}-double`,
    label:
      baseGrams != null
        ? formatGrams(baseGrams * 2)
        : doubleCountUnit(product.unit),
    price: product.price * 2,
    originalPrice: originalPrice * 2,
    grams: baseGrams != null ? baseGrams * 2 : null,
  };

  const similarProducts = ALL_PRODUCTS.filter(p => p.id !== product.id).slice(
    0,
    6,
  );

  return {
    description: `Fresh and premium-quality ${product.name.toLowerCase()}, handpicked for the best flavor and freshness. Perfect for snacking, salads, desserts, or adding to your favorite recipes.`,
    weightOptions: [baseOption, secondOption],
    baseGrams,
    similarProducts,
  };
}
