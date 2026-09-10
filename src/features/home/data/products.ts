/**
 * Shared Home-screen product catalog (dummy data). Centralized here — rather
 * than living inline in HomeScreen — so SearchScreen can filter the exact
 * same catalog instead of maintaining a second, drifting copy.
 *
 * TODO: replace with a real product API once one exists; the shape
 * (`Product`, from ../components/ProductCard) is deliberately what the API
 * response should map onto.
 */
import type { Product } from '../components/ProductCard';

export const VEGETABLES: Product[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    price: 18,
    unit: '500g',
    discountPercent: 5,
    imageUri:
      'https://images.unsplash.com/photo-1546470427-1ec4dcce90f4?w=300&q=80',
  },
  {
    id: 'potato',
    name: 'Potato',
    price: 16,
    unit: '1kg',
    discountPercent: 5,
    imageUri:
      'https://images.unsplash.com/photo-1518977676405-d4b1d56e2d92?w=300&q=80',
  },
  {
    id: 'capsicum',
    name: 'Capsicum',
    price: 24,
    unit: '500g',
    discountPercent: 5,
    imageUri:
      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&q=80',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    price: 20,
    unit: '500g',
    imageUri:
      'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300&q=80',
    // Deliberately out of stock - the one dummy item exercising ProductCard's
    // out-of-stock state (disabled Add, "Notify me") until real stock data exists.
    inStock: false,
  },
  {
    id: 'onion',
    name: 'Onion',
    price: 22,
    unit: '1kg',
    imageUri:
      'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=300&q=80',
  },
  {
    id: 'coriander',
    name: 'Coriander',
    price: 10,
    unit: '1 bunch',
    imageUri:
      'https://images.unsplash.com/photo-1622206151226-18ca2c9d680b?w=300&q=80',
  },
];

export const FRUITS: Product[] = [
  {
    id: 'apple',
    name: 'Apple',
    price: 120,
    unit: '4 pcs',
    discountPercent: 5,
    imageUri:
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80',
  },
  {
    id: 'banana',
    name: 'Banana',
    price: 36,
    unit: '6 pcs',
    badgeOverride: 'BEST_SELLER',
    imageUri:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80',
  },
  {
    id: 'grapes',
    name: 'Grapes',
    price: 55,
    unit: '500g',
    discountPercent: 5,
    imageUri:
      'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&q=80',
  },
  {
    id: 'mango',
    name: 'Mango',
    price: 40,
    unit: '1 pc',
    badgeOverride: 'NEW',
    imageUri:
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80',
  },
];

/**
 * "Today's Offers" - for now just the subset of the two catalogs above that
 * actually carry a discount, deduped by id. TODO: replace with a real
 * promotions/offers API - this is a derived view, not independent data, so
 * there's nothing to drift once a real source exists.
 */
export const OFFERS: Product[] = [...VEGETABLES, ...FRUITS].filter(
  p => p.discountPercent != null,
);

/** Full catalog, used by SearchScreen's live filtering. */
export const ALL_PRODUCTS: Product[] = [...VEGETABLES, ...FRUITS];

/**
 * DEMO DATA ONLY - stand-ins for real behavioral data so "Buy Again" and
 * "Recommended for You" have something to show in this build. Both are
 * conditionally-rendered components precisely so they can be hidden once
 * there's no real purchase/behavior history behind them - swap these two
 * arrays for the real thing (or back to `[]`) rather than deleting the
 * conditional rendering in BuyAgainSection/RecommendedSection.
 */
const BUY_AGAIN_IDS = ['tomato', 'banana', 'onion', 'coriander', 'potato'];
export const BUY_AGAIN_EXAMPLE: Product[] = BUY_AGAIN_IDS.map(id =>
  ALL_PRODUCTS.find(p => p.id === id),
).filter((p): p is Product => Boolean(p));

const RECOMMENDED_IDS = ['grapes', 'capsicum', 'mango', 'carrot'];
export const RECOMMENDED_EXAMPLE: Product[] = RECOMMENDED_IDS.map(id =>
  ALL_PRODUCTS.find(p => p.id === id),
).filter((p): p is Product => Boolean(p));
