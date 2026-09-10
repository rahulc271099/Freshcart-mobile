import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  useBottomTabBarHeight,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { Search } from 'lucide-react-native';

import { Header } from '@/components';
import type { AppTabsParamList } from '@/app/navigation/navigationTypes';
import { useCartItems } from '@/features/cart/hooks/useCartItems';
import { useCartStore } from '@/store/cartStore';
import { spacing, useTheme, type ThemeColors } from '@/theme';
import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { CategoryProductGrid } from '../components/CategoryProductGrid';
import { CategorySidebar } from '../components/CategorySidebar';
import type { SidebarCategory } from '../components/CategorySidebarItem';
import type { CategoryProduct } from '../components/CategoryProductCard';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const SIDEBAR_CATEGORIES: SidebarCategory[] = [
  {
    id: 'fresh-veg',
    label: 'Fresh Vegetables',
    imageUri:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80',
  },
  {
    id: 'leafy',
    label: 'Leafy and Seasoni...',
    imageUri:
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&q=80',
  },
  {
    id: 'exotic',
    label: 'Exotic Vegetables',
    imageUri:
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=200&q=80',
  },
  {
    id: 'frozen',
    label: 'Frozen Vegetables',
    imageUri:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=200&q=80',
  },
  {
    id: 'bouquet',
    label: 'Bouquet & Plants',
    imageUri:
      'https://images.unsplash.com/photo-1490750967868-88df5691cc7c?w=200&q=80',
  },
  {
    id: 'sprouts',
    label: 'Cuts and Sprouts',
    imageUri:
      'https://images.unsplash.com/photo-1467454940021-ebf6d55b3c7c?w=200&q=80',
  },
  {
    id: 'fruits',
    label: 'Fruits & Berries',
    imageUri:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80',
  },
];

const PRODUCTS: CategoryProduct[] = [
  {
    id: 'sweet-potato',
    name: 'Sweet Potato (Madurakizhangu)',
    imageUri:
      'https://images.unsplash.com/photo-1596097558038-c7f8cbf7a851?w=400&q=80',
    discountPercent: 5,
    originalPrice: 45,
    price: 36,
    pricePerUnit: '₹7.2/100g',
    defaultUnit: '500g',
    otherUnits: ['2 x 500g'],
    deliveryMins: 11,
  },
  {
    id: 'potato-kizhangu',
    name: 'Potato (Kizhangu)',
    imageUri:
      'https://images.unsplash.com/photo-1518977676405-d4b1d56e2d92?w=400&q=80',
    discountPercent: 5,
    originalPrice: 54,
    price: 43,
    pricePerUnit: '₹4.3/100g',
    defaultUnit: '1kg',
    otherUnits: ['3 x 1kg', '500g'],
    deliveryMins: 11,
  },
  {
    id: 'ooty-potato',
    name: 'Ooty Potato',
    imageUri:
      'https://images.unsplash.com/photo-1553174220-86be5a3fbb74?w=400&q=80',
    discountPercent: 5,
    originalPrice: 61,
    price: 49,
    pricePerUnit: '₹9.8/100g',
    defaultUnit: '500g',
    otherUnits: ['1kg', '3 x 1kg'],
    deliveryMins: 11,
  },
  {
    id: 'new-potato',
    name: 'New Potato',
    imageUri:
      'https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?w=400&q=80',
    discountPercent: 5,
    originalPrice: 64,
    price: 51,
    pricePerUnit: '₹5.1/100g',
    defaultUnit: '1kg',
    otherUnits: [],
    deliveryMins: 11,
  },
  {
    id: 'onion',
    name: 'Onion',
    imageUri:
      'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80',
    discountPercent: 5,
    originalPrice: 42,
    price: 34,
    pricePerUnit: '₹3.4/100g',
    defaultUnit: '1kg',
    otherUnits: ['500g'],
    deliveryMins: 11,
  },
  {
    id: 'ginger',
    name: 'Ginger',
    imageUri:
      'https://images.unsplash.com/photo-1573161027698-e1e96b5bf09a?w=400&q=80',
    discountPercent: 5,
    originalPrice: 55,
    price: 44,
    pricePerUnit: '₹8.8/100g',
    defaultUnit: '500g',
    otherUnits: ['250g'],
    deliveryMins: 11,
  },
];

const MAXXSAVER_THRESHOLD = 250;

// Approximate rendered height of the floating `CartBar` pill (its own
// content + the wrapper's bottom gap - see CartBar.tsx). Unlike the tab
// bar, `CartBar` has no `useBottomTabBarHeight()`-style measured-height
// hook, so this is a deliberate estimate, not an exact value - generous
// on purpose so the grid's last row can't end up hidden under it.
const CART_BAR_RESERVED_HEIGHT = 72;

// ─── Screen ───────────────────────────────────────────────────────────────────
// Kept deliberately thin - this screen only owns navigation/data wiring and
// composes each visual section from features/categories/components. See
// CategoryFilterBar, CategorySidebar and CategoryProductGrid for the actual
// section UI.

export function CategoriesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeCategoryId, setActiveCategoryId] = useState('fresh-veg');
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();

  const addItem = useCartStore(state => state.addItem);
  const { itemCount, totals } = useCartItems();
  const cartBarVisible = itemCount > 0;

  const activeCategory = useMemo(
    () => SIDEBAR_CATEGORIES.find(c => c.id === activeCategoryId),
    [activeCategoryId],
  );

  const handleAddToCart = useCallback(
    (product: CategoryProduct) => {
      addItem(product.id);
    },
    [addItem],
  );

  const progressPercent = useMemo(
    () => Math.min((totals.itemsTotal / MAXXSAVER_THRESHOLD) * 100, 100),
    [totals.itemsTotal],
  );

  const remaining = Math.max(MAXXSAVER_THRESHOLD - totals.itemsTotal, 0);

  // Both the sidebar and the product grid must clear the SAME floating
  // chrome (the absolutely-positioned tab bar, plus CartBar when it's
  // showing) - sharing one computed value instead of each side computing
  // its own is what was missing before: the grid's own padding had
  // silently dropped `tabBarHeight`, so its last row scrolled in behind
  // the tab bar while the sidebar (which did include it) scrolled clear.
  const bodyBottomPadding =
    spacing.lg + tabBarHeight + (cartBarVisible ? CART_BAR_RESERVED_HEIGHT : 0);

  return (
    // Main screen background is always `colors.background` - `backgroundSec`
    // is reserved for sections explicitly called out as secondary (the
    // sidebar, inside CategorySidebar), not the default page backdrop.
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header
        title={activeCategory?.label ?? 'Categories'}
        onBackPress={() => navigation.navigate('Home')}
        rightAccessory={
          <Pressable hitSlop={8}>
            <Search color={colors.textPrimary} size={22} strokeWidth={2} />
          </Pressable>
        }
        style={styles.header}
      />

      <CategoryFilterBar />

      <View style={styles.body}>
        <CategorySidebar
          categories={SIDEBAR_CATEGORIES}
          activeCategoryId={activeCategoryId}
          onSelect={setActiveCategoryId}
          bottomPadding={bodyBottomPadding}
        />
        <CategoryProductGrid
          products={PRODUCTS}
          onAddToCart={handleAddToCart}
          bottomPadding={bodyBottomPadding}
        />
      </View>

      {/* Floating cart summary - only rendered once there's something in
          the cart (CartBar itself also no-ops at itemCount 0, but keeping
          the condition here too makes "certain conditions" visible at the
          call site). Sits above the floating tab bar pill via
          `marginBottom: tabBarHeight`, same pattern as CartScreen's
          checkout footer. */}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Only what this screen's own layout (not any section's internals) needs.

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
    },
    // `Header` (see components/Header.tsx) owns the row layout/back button/
    // title styling - this just adds the horizontal padding, background and
    // bottom border it doesn't apply itself.
    header: {
      paddingHorizontal: spacing.md,
      paddingBottom: 2,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    body: {
      flex: 1,
      flexDirection: 'row',
      paddingBottom: spacing.md,
    },
  });
}
