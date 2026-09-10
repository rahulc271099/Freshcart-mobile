import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { AppTabsParamList } from '@/app/navigation/navigationTypes';
import { Header } from '@/components';
import { icons } from '@/constants/icons';
import { radius, spacing, useTheme, type ThemeColors } from '@/theme';
import { ApplyCouponRow } from '../components/ApplyCouponRow';
import { CartEmptyState } from '../components/CartEmptyState';
import { CartItemRow } from '../components/CartItemRow';
import { CheckoutFooter } from '../components/CheckoutFooter';
import { MaxxsaverBanner } from '../components/MaxxsaverBanner';
import { PriceDetailsCard } from '../components/PriceDetailsCard';
import { useCartItems } from '../hooks/useCartItems';

/** Spend threshold for the "Maxxsaver" perk banner. TODO: replace with a real offers/promotions API - same placeholder pattern as CategoriesScreen's own copy of this. */
const MAXXSAVER_THRESHOLD = 250;
const MAXXSAVER_LABEL = 'Maxxsaver';

// ─── Screen ───────────────────────────────────────────────────────────────────
// Kept deliberately thin - this screen only owns navigation/data wiring and
// composes each visual section from features/cart/components. See
// MaxxsaverBanner, ApplyCouponRow, PriceDetailsCard, CheckoutFooter and
// CartEmptyState for the actual section UI.

export function CartScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Unlike Home/Categories, the floating tab bar is hidden entirely while
  // on this tab (see AppTabs.tsx's `AnimatedTabBar` - it hides on
  // `state.routes[state.index].name === 'Cart'`), so the checkout footer
  // doesn't need `useBottomTabBarHeight()` to clear it - just the raw
  // safe-area inset, same as AppTabs computes for the pill itself.
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();

  const { lines, totals, itemCount, updateQuantity, clearCart } =
    useCartItems();

  // The tab bar being hidden here means it's no longer available as a way
  // back to Home/Categories - this replaces it for this screen.
  const handleGoBack = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handleIncrement = useCallback(
    (id: string) => {
      const line = lines.find(l => l.id === id);
      if (line) updateQuantity(id, line.quantity + 1);
    },
    [lines, updateQuantity],
  );

  const handleDecrement = useCallback(
    (id: string) => {
      const line = lines.find(l => l.id === id);
      if (line) updateQuantity(id, line.quantity - 1);
    },
    [lines, updateQuantity],
  );

  const handleClearCart = useCallback(() => {
    Alert.alert(
      'Clear cart?',
      'This removes all items from your cart.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ],
      { cancelable: true },
    );
  }, [clearCart]);

  // TODO: wire to features/checkout once it exists.
  const handleCheckout = useCallback(() => {}, []);

  const maxxsaverRemaining = Math.max(
    MAXXSAVER_THRESHOLD - totals.itemsTotal,
    0,
  );
  const maxxsaverProgress = Math.min(
    (totals.itemsTotal / MAXXSAVER_THRESHOLD) * 100,
    100,
  );

  // ── Empty state ──────────────────────────────────────────────────────
  if (lines.length === 0) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <Header
          title="My Cart"
          onBackPress={handleGoBack}
          style={styles.header}
        />
        <CartEmptyState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Header
        title="My Cart"
        subtitle={`${itemCount} item${itemCount === 1 ? '' : 's'} in your cart`}
        onBackPress={handleGoBack}
        rightAccessory={
          <Pressable
            style={styles.trashBtn}
            onPress={handleClearCart}
            hitSlop={8}
            accessibilityLabel="Clear cart"
          >
            <icons.trash color={colors.textPrimary} size={20} strokeWidth={2} />
          </Pressable>
        }
        style={styles.header}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <MaxxsaverBanner
          remaining={maxxsaverRemaining}
          progress={maxxsaverProgress}
          label={MAXXSAVER_LABEL}
        />

        {/* A plain `.map()` rather than a nested FlatList, since this list
            lives inside the screen's own outer ScrollView (nesting a
            vertical FlatList inside a vertical ScrollView breaks scrolling
            on both platforms) and cart line counts are small. */}
        <View style={styles.items}>
          {lines.map(line => (
            <CartItemRow
              key={line.id}
              line={line}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
            />
          ))}
        </View>

        <ApplyCouponRow />
        <PriceDetailsCard totals={totals} />
      </ScrollView>

      <CheckoutFooter
        total={totals.toPay}
        onCheckout={handleCheckout}
        style={{ marginBottom: insets.bottom }}
      />
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
    // title styling - this just adds the horizontal screen padding and
    // background it doesn't apply itself.
    header: {
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
    },
    trashBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    items: {
      gap: spacing.sm,
    },
  });
}
