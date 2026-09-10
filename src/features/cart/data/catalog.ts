import type { CartLineItem } from '../types/cart.types';

/**
 * Product lookup so the cart (which only stores `{ productId, quantity }` -
 * see `store/cartStore.ts`) can resolve full display data (name, image,
 * price) for whatever's actually in it.
 *
 * TODO(catalog): this duplicates values that already live in
 * `HomeScreen.tsx`'s `VEGETABLES`/`FRUITS` and `CategoriesScreen.tsx`'s
 * `PRODUCTS` dummy arrays - there's no shared product catalog module yet,
 * so each screen (including this one) keeps its own local copy, same as
 * everywhere else in the app right now. The real fix is extracting a single
 * `src/data/products.ts` (or a `features/products` API) that all three
 * import from, so a price change only happens in one place. Kept as a
 * distinct file/TODO here rather than done silently, since it's a
 * cross-screen refactor beyond this task's scope.
 */
export const CART_CATALOG: Record<string, CartLineItem> = {
  // ── From HomeScreen's VEGETABLES ──────────────────────────────────────
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    imageUri:
      'https://images.unsplash.com/photo-1546470427-1ec4dcce90f4?w=300&q=80',
    price: 18,
    originalPrice: 19,
    unit: '500 g',
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    imageUri:
      'https://images.unsplash.com/photo-1518977676405-d4b1d56e2d92?w=300&q=80',
    price: 16,
    originalPrice: 17,
    unit: '1 kg',
  },
  capsicum: {
    id: 'capsicum',
    name: 'Capsicum',
    imageUri:
      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&q=80',
    price: 24,
    originalPrice: 25,
    unit: '500 g',
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    imageUri:
      'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300&q=80',
    price: 20,
    originalPrice: 21,
    unit: '500 g',
  },

  // ── From HomeScreen's FRUITS ───────────────────────────────────────────
  apple: {
    id: 'apple',
    name: 'Apple',
    imageUri:
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&q=80',
    price: 120,
    originalPrice: 126,
    unit: '4 pcs',
  },
  banana: {
    id: 'banana',
    name: 'Banana',
    imageUri:
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80',
    price: 36,
    originalPrice: 38,
    unit: '6 pcs',
  },
  grapes: {
    id: 'grapes',
    name: 'Grapes Usa 500 Gm',
    imageUri:
      'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&q=80',
    price: 55,
    originalPrice: 58,
    unit: '500 g',
  },
  mango: {
    id: 'mango',
    name: 'Mango',
    imageUri:
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80',
    price: 40,
    originalPrice: 42,
    unit: '1 pc',
  },

  // ── From CategoriesScreen's PRODUCTS ───────────────────────────────────
  'sweet-potato': {
    id: 'sweet-potato',
    name: 'Sweet Potato (Madurakizhangu)',
    imageUri:
      'https://images.unsplash.com/photo-1596097558038-c7f8cbf7a851?w=400&q=80',
    price: 36,
    originalPrice: 45,
    unit: '500 g',
  },
  'potato-kizhangu': {
    id: 'potato-kizhangu',
    name: 'Potato (Kizhangu)',
    imageUri:
      'https://images.unsplash.com/photo-1518977676405-d4b1d56e2d92?w=400&q=80',
    price: 43,
    originalPrice: 54,
    unit: '1 kg',
  },
  'ooty-potato': {
    id: 'ooty-potato',
    name: 'Ooty Potato',
    imageUri:
      'https://images.unsplash.com/photo-1553174220-86be5a3fbb74?w=400&q=80',
    price: 49,
    originalPrice: 61,
    unit: '500 g',
  },
  'new-potato': {
    id: 'new-potato',
    name: 'New Potato',
    imageUri:
      'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?w=400&q=80',
    price: 51,
    originalPrice: 64,
    unit: '1 kg',
  },
  onion: {
    id: 'onion',
    name: 'Onion',
    imageUri:
      'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80',
    price: 34,
    originalPrice: 42,
    unit: '1 kg',
  },
  ginger: {
    id: 'ginger',
    name: 'Ginger',
    imageUri:
      'https://images.unsplash.com/photo-1573161027698-e1e96b5bf09a?w=400&q=80',
    price: 44,
    originalPrice: 55,
    unit: '500 g',
  },
};
