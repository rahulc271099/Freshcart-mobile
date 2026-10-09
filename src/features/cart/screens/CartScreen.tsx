import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useNavigation,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type {
  AppTabsParamList,
  MainStackParamList,
} from '@/app/navigation/navigationTypes';
import { Header, Skeleton } from '@/components';
import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';
import { useCartOffers } from '@/features/offers/hooks/useCartOffers';
import { useCartStore } from '@/store/cartStore';
import { AvailableOffersCard } from '../components/AvailableOffersCard';
import { CartEmptyState } from '../components/CartEmptyState';
import { CartItemRow } from '../components/CartItemRow';
import { CartScreenSkeleton } from '../components/CartScreenSkeleton';
import { CheckoutFooter } from '../components/CheckoutFooter';
import { MaxxsaverBanner } from '../components/MaxxsaverBanner';
import { OffersBottomSheet } from '../components/OffersBottomSheet';
import { PriceDetailsCard } from '../components/PriceDetailsCard';
import { useCartItems } from '../hooks/useCartItems';

function countDecimals(value: number): number {
  const str = value.toString();
  const i = str.indexOf('.');
  return i === -1 ? 0 : str.length - i - 1;
}

/** Snaps `value` onto the nearest multiple of `step`, fixed to `step`'s
 * own decimal precision - same helper as `ProductOptionsSheet.tsx`'s own
 * `roundToStep` (duplicated rather than imported - different feature
 * folder, same exception that file's own `stripNamePrefix` makes). Used
 * by `handleIncrement`/`handleDecrement` below so a custom-quantity
 * line's stepper lands on clean weights (0.25/0.5/0.75 kg, ...) instead
 * of drifting with floating-point noise. */
function roundToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const decimals = countDecimals(step);
  const snapped = Math.round(value / step) * step;
  return Number(snapped.toFixed(decimals));
}

// ─── Screen ───────────────────────────────────────────────────────────────────
// Kept deliberately thin - this screen only owns navigation/data wiring and
// composes each visual section from features/cart/components. See
// MaxxsaverBanner, ApplyCouponRow, PriceDetailsCard, CheckoutFooter and
// CartEmptyState for the actual section UI.

// Needs both this tab's own navigation (`navigate('Home')` - see
// handleGoBack) AND the parent stack's (`navigate('Checkout')`, pushed
// outside the tab bar - see MainNavigator.tsx) - same composite pattern
// HomeScreen/CategoriesScreen already use for the same reason.
type CartNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Cart'>,
  NativeStackNavigationProp<MainStackParamList>
>;

export function CartScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Unlike Home/Categories, the floating tab bar is hidden entirely while
  // on this tab (see AppTabs.tsx's `AnimatedTabBar` - it hides on
  // `state.routes[state.index].name === 'Cart'`), so the checkout footer
  // doesn't need `useBottomTabBarHeight()` to clear it - just the raw
  // safe-area inset, same as AppTabs computes for the pill itself.
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CartNavigationProp>();

  const {
    lines,
    totals,
    itemCount,
    updateQuantity,
    updateCustomQuantityAmount,
    clearCart,
  } = useCartItems();
  const isHydrating = useCartStore(state => state.isHydrating);
  const syncNotice = useCartStore(state => state.syncNotice);
  const dismissSyncNotice = useCartStore(state => state.dismissSyncNotice);
  const { data: cartOffers, isLoading: isOffersLoading } = useCartOffers();
  const [offersSheetVisible, setOffersSheetVisible] = useState(false);

  // The top banner promotes the highest-priority offer (backend's own
  // `DisplayOrder`, already how `useCartOffers` returns them) that ISN'T
  // free delivery - free delivery stays down in `AvailableOffersCard`
  // (the user asked for it to stay "at the current place"). Replaces the
  // old hardcoded `MAXXSAVER_THRESHOLD` placeholder now that there's a
  // real offers API behind this.
  const primaryOffer = useMemo(
    () => cartOffers?.find(offer => offer.offer_type !== 'FREE_DELIVERY') ?? null,
    [cartOffers],
  );

  // The tab bar being hidden here means it's no longer available as a way
  // back to Home/Categories - this replaces it for this screen (the
  // header's back button AND the "Add more items" row below both use it -
  // they go to the exact same place, so there's no reason for two
  // separate handlers that do the same `navigate('Home')`).
  const handleGoBack = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  // A real pack-size variant steps its plain pack COUNT by one, same as
  // always. A custom-quantity line (`apiBaseQty` set) steps its real
  // WEIGHT by the product's own `stepQty` instead, clamped to
  // `minQty..maxQty` - calling `updateQuantity(id, line.quantity + 1)`
  // here (the old code, for every line) was the actual bug: for a
  // custom-quantity line it multiplied the whole weight instead of
  // stepping it (3 kg -> "quantity 2" -> 6 kg sent to the server).
  // `quantityRule` not being set (an orphan line from another device -
  // see `cartStore.ts`'s `hydrateFromServer`) falls back to stepping by
  // a plain 1 unit with no upper bound, which still fixes the
  // multiplication bug even without a cached rule to enforce.
  const handleIncrement = useCallback(
    (id: string) => {
      const line = lines.find(l => l.id === id);
      if (!line) return;
      if (line.apiBaseQty != null) {
        const stepQty = line.quantityRule?.stepQty ?? 1;
        const maxQty = line.quantityRule?.maxQty ?? Infinity;
        const next = roundToStep(line.apiBaseQty + stepQty, stepQty);
        updateCustomQuantityAmount(id, Math.min(next, maxQty));
        return;
      }
      updateQuantity(id, line.quantity + 1);
    },
    [lines, updateQuantity, updateCustomQuantityAmount],
  );

  const handleDecrement = useCallback(
    (id: string) => {
      const line = lines.find(l => l.id === id);
      if (!line) return;
      if (line.apiBaseQty != null) {
        const stepQty = line.quantityRule?.stepQty ?? 1;
        const minQty = line.quantityRule?.minQty ?? 0;
        const next = roundToStep(line.apiBaseQty - stepQty, stepQty);
        // Dropping below the product's own floor removes the line
        // outright, same convention `updateCustomQuantityAmount`/
        // `updateQuantity` already both use for "quantity <= 0".
        updateCustomQuantityAmount(id, next < minQty ? 0 : next);
        return;
      }
      updateQuantity(id, line.quantity - 1);
    },
    [lines, updateQuantity, updateCustomQuantityAmount],
  );

  // Reopens the full options sheet (via ProductDetailsScreen, which
  // already renders it) for this line's product - for jumping straight
  // to a different pack size/weight instead of tapping the stepper
  // repeatedly.
  const handleChangeQty = useCallback(
    (productId: string) => {
      navigation.navigate('ProductDetails', { productId });
    },
    [navigation],
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

  // Below the delivery area's minimum order the backend rejects the
  // order outright (`MINIMUM_ORDER_AMOUNT`) - stop it here with a clear
  // "add ₹X more" instead of letting the shopper walk through address +
  // payment only to be refused at the last step.
  const belowMinimum = totals.minimumOrderShortfall > 0;
  const checkoutHint = belowMinimum
    ? `Add ₹${Math.ceil(totals.minimumOrderShortfall)} more to place an order (minimum ₹${totals.minimumOrderAmount})`
    : null;

  const handleCheckout = useCallback(() => {
    if (belowMinimum) return;
    navigation.navigate('Checkout');
  }, [navigation, belowMinimum]);

  // No `min_order_amount` means the offer isn't gated by a minimum spend
  // at all - treat it as already unlocked rather than dividing by zero.
  const primaryThreshold = primaryOffer?.min_order_amount ?? null;
  const offerRemaining =
    primaryThreshold != null
      ? Math.max(primaryThreshold - totals.itemsTotal, 0)
      : 0;
  const offerProgress =
    primaryThreshold != null && primaryThreshold > 0
      ? Math.min((totals.itemsTotal / primaryThreshold) * 100, 100)
      : 100;

  const handleViewOffers = useCallback(() => {
    setOffersSheetVisible(true);
  }, []);

  // ── Loading state ────────────────────────────────────────────────────
  // Only reachable before the cart's first server sync has resolved (see
  // `cartStore.ts`'s `isHydrating`) AND there's nothing cached locally yet
  // to show in the meantime - once either is true, the real content (or
  // the real empty state below) renders instead.
  if (lines.length === 0 && isHydrating) {
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
        <CartScreenSkeleton />
      </SafeAreaView>
    );
  }

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
        {syncNotice ? (
          <Pressable
            style={styles.noticeBar}
            onPress={dismissSyncNotice}
            accessibilityRole="alert"
            accessibilityHint="Tap to dismiss"
          >
            <Text style={styles.noticeText}>{syncNotice}</Text>
          </Pressable>
        ) : null}

        {isOffersLoading ? (
          <Skeleton width="100%" height={60} borderRadius={radius.lg} />
        ) : primaryOffer ? (
          <MaxxsaverBanner
            remaining={offerRemaining}
            progress={offerProgress}
            label={primaryOffer.label ?? primaryOffer.title}
            onViewOffers={handleViewOffers}
          />
        ) : null}

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
              onChangeQty={handleChangeQty}
            />
          ))}
        </View>

        <Pressable
          style={styles.addMoreBtn}
          onPress={handleGoBack}
          accessibilityRole="button"
          accessibilityLabel="Add more items"
        >
          <Plus color={colors.primary} size={16} strokeWidth={2.5} />
          <Text style={styles.addMoreText}>Add more items</Text>
        </Pressable>

        {isOffersLoading ? (
          <Skeleton width="100%" height={80} borderRadius={radius.lg} />
        ) : (
          <AvailableOffersCard
            eligibleSubtotal={totals.itemsTotal}
            excludeOfferId={primaryOffer?.offer_id}
          />
        )}

        <PriceDetailsCard totals={totals} />
      </ScrollView>

      <CheckoutFooter
        total={totals.toPay}
        onCheckout={handleCheckout}
        disabled={belowMinimum}
        hint={checkoutHint}
        style={{ marginBottom: insets.bottom }}
      />

      <OffersBottomSheet
        visible={offersSheetVisible}
        onClose={() => setOffersSheetVisible(false)}
        offers={cartOffers ?? []}
        eligibleSubtotal={totals.itemsTotal}
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
    noticeBar: {
      backgroundColor: `${colors.warning}1F`,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    noticeText: {
      fontSize: 12.5,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
    },
    addMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: radius.lg,
      paddingVertical: spacing.sm + 2,
    },
    addMoreText: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
  });
}
