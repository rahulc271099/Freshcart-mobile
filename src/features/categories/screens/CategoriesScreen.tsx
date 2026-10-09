import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  useRoute,
  type CompositeNavigationProp,
  type RouteProp,
} from '@react-navigation/native';
import {
  useBottomTabBarHeight,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PackageSearch, Search } from 'lucide-react-native';

import {
  EmptyState,
  ErrorView,
  Header,
  type Product,
  type ProductVariant,
} from '@/components';
import type {
  AppTabsParamList,
  MainStackParamList,
} from '@/app/navigation/navigationTypes';
import { icons } from '@/constants/icons';
import { useCartItems } from '@/features/cart/hooks/useCartItems';
import { useCartStore } from '@/store/cartStore';
import { spacing, useTheme, type ThemeColors } from '@/theme';
import { CategoryFilterBar } from '../components/CategoryFilterBar';
import { CategoryProductGrid } from '../components/CategoryProductGrid';
import { CategoryProductGridSkeleton } from '../components/CategoryProductGridSkeleton';
import { CategorySidebar } from '../components/CategorySidebar';
import { CategorySidebarSkeleton } from '../components/CategorySidebarSkeleton';
import { useCustomerProducts } from '../hooks/useCustomerProducts';
import { useGroups } from '../hooks/useGroups';
import {
  mapCustomerProductCardToProduct,
  mapGroupToSidebarCategory,
} from '../utils/mapCatalogueData';

// Composite because this screen needs to navigate BOTH within its own tab
// navigator (Home/Cart tabs) AND to screens pushed above the tab bar on
// the parent stack (Search, ProductDetails) - a plain
// `BottomTabNavigationProp<AppTabsParamList>` only knows about the three
// tab routes, so `navigation.navigate('Search')` wasn't just unwired, it
// wasn't even a type the navigator prop could reach. Same pattern as
// `HomeScreen`'s `HomeNavigationProp`.
type CategoriesNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Categories'>,
  NativeStackNavigationProp<MainStackParamList>
>;

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
// section UI, and features/categories/utils/mapCatalogueData.ts for how the
// raw API responses become the props those components already expect.

export function CategoriesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<CategoriesNavigationProp>();
  // Home's group strip deep-links here with `groupId`.
  const route = useRoute<RouteProp<AppTabsParamList, 'Categories'>>();
  const requestedGroupId = route.params?.groupId;

  const addVariantLine = useCartStore(state => state.addVariantLine);
  const setCustomQuantityLine = useCartStore(state => state.setCustomQuantityLine);
  const { itemCount } = useCartItems();
  const cartBarVisible = itemCount > 0;

  const {
    data: groups,
    isLoading: groupsLoading,
    isError: groupsErrored,
    refetch: refetchGroups,
  } = useGroups();
    console.log("🚀 ~ CategoriesScreen ~ groups:", groups)
  // The sidebar always needs something selected, and there's no
  // "selected group" concept coming from anywhere else yet - default to
  // the first group as soon as groups have loaded.
  useEffect(() => {
    if (activeGroupId === null && groups && groups.length > 0) {
      setActiveGroupId(groups[0].group_id);
    }
  }, [groups, activeGroupId]);

  // A deep link (also fires when the tab is already mounted and Home
  // navigates again). Ignored if the id isn't a known group, so a stale
  // link can't leave the sidebar with nothing selected.
  useEffect(() => {
    if (
      requestedGroupId != null &&
      groups?.some(g => g.group_id === requestedGroupId)
    ) {
      setActiveGroupId(requestedGroupId);
    }
  }, [requestedGroupId, groups]);

  // Scoped to just the active group (server-side, via `group_id`) -
  // unlike the old full-catalogue `/products/tree/` fetch, this stays
  // disabled (`enabled: groupId != null`) until a group is actually
  // selected, and refetches automatically when the shopper switches
  // groups (`activeGroupId` is part of this hook's query key).
  const {
    data: productsPage,
    isLoading: productsQueryLoading,
    isError: productsErrored,
    refetch: refetchProducts,
  } = useCustomerProducts(activeGroupId);
    console.log("🚀 ~ CategoriesScreen ~ productsPage:", productsPage)

  const sidebarCategories = useMemo(
    () => (groups ?? []).map(mapGroupToSidebarCategory),
    [groups],
  );

  const activeGroup = useMemo(
    () => groups?.find(g => g.group_id === activeGroupId),
    [groups, activeGroupId],
  );

  const gridProducts = useMemo(
    () => (productsPage?.results ?? []).map(mapCustomerProductCardToProduct),
    [productsPage],
  );

  // A custom-quantity (loose/bulk, sold-by-weight) pick always replaces
  // the product's single cart line; a real pack-size variant is always
  // its own separate line - see `ProductVariant.isCustomQuantitySelection`
  // and `cartStore.ts`'s own comments for why the two can't share one
  // merge behavior.
  const handleAddToCart = useCallback(
    (product: Product, variant: ProductVariant, quantity: number) => {
      const shared = {
        productId: product.id,
        quantity,
        name: product.name,
        imageUri: product.imageUri,
        price: variant.price,
        originalPrice: variant.mrp,
        unit: variant.label,
        // Real catalogue products here (see `mapCustomerProductCardToProduct`),
        // so this IS set - `cartStore` uses it to actually sync the line
        // to the server cart.
        apiVariantId: variant.apiVariantId,
      };
      if (variant.isCustomQuantitySelection) {
        setCustomQuantityLine({
          ...shared,
          apiBaseQty: variant.apiBaseQty,
          // Snapshotted so the cart screen's own stepper can step this
          // line by the product's real `stepQty` - see `cartStore.ts`'s
          // `CartItem.quantityRule`.
          quantityRule: variant.quantityRule,
          pricingUnitLabel: variant.pricingUnitLabel,
        });
      } else {
        addVariantLine({ ...shared, variantId: variant.id });
      }
    },
    [addVariantLine, setCustomQuantityLine],
  );

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetails', { productId: product.id });
    },
    [navigation],
  );

  // Both the sidebar and the product grid must clear the SAME floating
  // chrome (the absolutely-positioned tab bar, plus CartBar when it's
  // showing) - sharing one computed value instead of each side computing
  // its own is what was missing before: the grid's own padding had
  // silently dropped `tabBarHeight`, so its last row scrolled in behind
  // the tab bar while the sidebar (which did include it) scrolled clear.
  const bodyBottomPadding =
    spacing.lg + tabBarHeight + (cartBarVisible ? CART_BAR_RESERVED_HEIGHT : 0);

  // Groups drive the sidebar itself, so a failed/loading GROUPS call is
  // the only thing that takes priority over the whole body - there's
  // nothing sensible to render (not even a sidebar) without them.
  // `activeGroupId === null` is included explicitly (not just checked via
  // products) so this stays true through the one-tick gap between groups
  // arriving and the effect above picking a default group.
  //
  // A group SWITCH is deliberately scoped to the product grid only below
  // (not this top-level branch) - the sidebar itself has everything it
  // needs (the groups list) the moment groups load, and switching which
  // group is active shouldn't make the sidebar itself flicker through a
  // skeleton on every tap; only the grid area (which has to wait on a new
  // network response) shows its own loading/error/empty state.
  const groupsLoadingOrUnset = groupsLoading || activeGroupId === null;

  const handleRetryGroups = useCallback(() => {
    refetchGroups();
  }, [refetchGroups]);

  return (
    // Main screen background is always `colors.background` - `backgroundSec`
    // is reserved for sections explicitly called out as secondary (the
    // sidebar, inside CategorySidebar), not the default page backdrop.
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header
        title={activeGroup?.display_name ?? 'Categories'}
        onBackPress={() => navigation.navigate('Home')}
        rightAccessory={
          <Pressable
            hitSlop={8}
            onPress={() => navigation.navigate('Search')}
            accessibilityLabel="Search products"
          >
            <Search color={colors.textPrimary} size={22} strokeWidth={2} />
          </Pressable>
        }
        style={styles.header}
      />

      <CategoryFilterBar />

      {groupsLoadingOrUnset ? (
        // Full skeleton (sidebar + grid shape) - only reachable for the
        // very first load, before groups exist at all to drive a sidebar.
        <View style={styles.body}>
          <CategorySidebarSkeleton />
          <CategoryProductGridSkeleton />
        </View>
      ) : groupsErrored ? (
        <ErrorView
          title="Couldn't load categories"
          body="Check your connection and try again."
          onRetry={handleRetryGroups}
        />
      ) : sidebarCategories.length === 0 ? (
        <EmptyState
          icon={icons.categories}
          title="No categories yet"
          body="There's nothing under this category right now."
        />
      ) : (
        <View style={styles.body}>
          <CategorySidebar
            categories={sidebarCategories}
            activeCategoryId={
              activeGroupId !== null ? String(activeGroupId) : ''
            }
            onSelect={id => setActiveGroupId(Number(id))}
            bottomPadding={bodyBottomPadding}
          />

          {/* Scoped to just this area - the sidebar above stays mounted
              and interactive the whole time a group switch is loading, so
              tapping a different group never makes the categories list
              itself disappear or skeleton-flash. */}
          {productsQueryLoading ? (
            <View style={styles.gridLoadingWrap}>
              <CategoryProductGridSkeleton />
            </View>
          ) : productsErrored ? (
            <View style={styles.emptyGridWrap}>
              <ErrorView
                title="Couldn't load products"
                body="Check your connection and try again."
                onRetry={refetchProducts}
              />
            </View>
          ) : gridProducts.length === 0 ? (
            <View style={styles.emptyGridWrap}>
              <EmptyState
                icon={PackageSearch}
                title="No products yet"
                body={`Nothing in ${
                  activeGroup?.display_name ?? 'this group'
                } right now.`}
              />
            </View>
          ) : (
            <CategoryProductGrid
              products={gridProducts}
              onAddToCart={handleAddToCart}
              onProductPress={handleProductPress}
              bottomPadding={bodyBottomPadding}
            />
          )}
        </View>
      )}

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
    // Fills the same space CategoryProductGrid would, next to the sidebar,
    // so the empty state doesn't collapse to zero width in a row flexbox.
    emptyGridWrap: {
      flex: 1,
    },
    // Same reasoning as `emptyGridWrap` above, for the grid-only loading
    // skeleton shown during a group switch.
    gridLoadingWrap: {
      flex: 1,
    },
  });
}
