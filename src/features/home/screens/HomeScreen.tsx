import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useNavigation,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import {
  useBottomTabBarHeight,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTabBarVisibility } from '@/app/navigation/TabBarVisibilityContext';
import type {
  AppTabsParamList,
  MainStackParamList,
} from '@/app/navigation/navigationTypes';
import { spacing, useTheme, type ThemeColors } from '@/theme';
import { BuyAgainSection } from '../components/BuyAgainSection';
import { CategoryRow } from '../components/CategoryRow';
import { DeliveryHeader } from '../components/DeliveryHeader';
import { HeroBanner } from '../components/HeroBanner';
import { HomeSearchBar } from '../components/HomeSearchBar';
import { ProductSection } from '../components/ProductSection';
import { ProductSectionSkeleton } from '../components/ProductCardSkeleton';
import { RecommendedSection } from '../components/RecommendedSection';
import { WhyFreshCartSection } from '../components/WhyFreshCartSection';
import {
  BUY_AGAIN_EXAMPLE,
  FRUITS,
  OFFERS,
  RECOMMENDED_EXAMPLE,
  VEGETABLES,
} from '../data/products';
import type { Product } from '../components/ProductCard';

/** Scroll delta (px) needed to trigger a hide/show, so tiny jitters don't. */
const SCROLL_THRESHOLD = 10;
/** Show/hide transition duration - matches AppTabs.tsx's own tab-switch reset. */
const VISIBILITY_DURATION = 220;
/** How long the initial skeleton loading state shows before swapping to the
 * real (dummy-data) content - simulates a first fetch. */
const INITIAL_LOAD_MS = 700;
/** Simulated pull-to-refresh duration. */
const REFRESH_MS = 900;

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // The floating tab bar is `position: 'absolute'` (see AppTabs.tsx) so it
  // overlays screen content rather than reserving space for itself - this
  // hook reports its actual rendered height so the last section of content
  // can clear it instead of sitting underneath it.
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<HomeNavigationProp>();

  // Drives the shared tab-bar visibility value from this screen's scroll
  // position - see TabBarVisibilityContext.tsx for why this needs a Context
  // rather than a prop (AppTabs renders the bar; HomeScreen is its
  // descendant screen).
  const tabBarVisibility = useTabBarVisibility();
  // The delivery header's own show/hide is a *separate* shared value - kept
  // fully independent from the tab bar's. Only `DeliveryHeader` itself
  // (address + notification/profile icons) hides on scroll now - the
  // search bar and category row sit in their own fixed group below it and
  // never hide, per explicit request.
  const headerVisibility = useSharedValue(1);
  const headerHeight = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const currentY = event.contentOffset.y;

      if (currentY <= 0) {
        // Always show once back at (or above) the top.
        tabBarVisibility.value = withTiming(1, {
          duration: VISIBILITY_DURATION,
        });
        headerVisibility.value = withTiming(1, {
          duration: VISIBILITY_DURATION,
        });
        lastScrollY.value = 0;
        return;
      }

      const delta = currentY - lastScrollY.value;
      if (delta > SCROLL_THRESHOLD) {
        // Scrolled down past the threshold - hide both (independently).
        tabBarVisibility.value = withTiming(0, {
          duration: VISIBILITY_DURATION,
        });
        headerVisibility.value = withTiming(0, {
          duration: VISIBILITY_DURATION,
        });
        lastScrollY.value = currentY;
      } else if (delta < -SCROLL_THRESHOLD) {
        // Scrolled up past the threshold - reveal both.
        tabBarVisibility.value = withTiming(1, {
          duration: VISIBILITY_DURATION,
        });
        headerVisibility.value = withTiming(1, {
          duration: VISIBILITY_DURATION,
        });
        lastScrollY.value = currentY;
      }
      // Otherwise: within the threshold of the last hide/show decision -
      // don't update `lastScrollY`, so small back-and-forth jitter keeps
      // accumulating against that last decision point instead of resetting.
    },
  });

  // The header collapses its own height (rather than only translating/
  // fading) so nothing below it leaves a blank gap while it's hidden -
  // `onLayout` below captures its natural height once so this has
  // something to animate towards.
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    height:
      headerHeight.value === 0
        ? undefined
        : interpolate(headerVisibility.value, [0, 1], [0, headerHeight.value]),
    opacity: headerVisibility.value,
  }));
  const handleHeaderLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      if (headerHeight.value === 0) {
        headerHeight.value = event.nativeEvent.layout.height;
      }
    },
    [headerHeight],
  );

  // `ProductCard` now reads/writes the cart store directly (see its own
  // comment) - this is only a side-effect hook (e.g. analytics) passed down
  // as `onAddToCart`, NOT a second place that mutates the cart. It used to
  // also call `addItem` here, which double-counted every tap (quantity
  // jumped by 2, not 1) - don't reintroduce that.
  const handleAddToCart = useCallback((_product: Product) => {}, []);

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetails', { productId: product.id });
    },
    [navigation],
  );

  // ── Simulated initial load (skeleton -> real content) ─────────────────
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), INITIAL_LOAD_MS);
    return () => clearTimeout(timer);
  }, []);

  // ── Pull-to-refresh: native indicator only, no card/image stretching -
  // RefreshControl's own spinner is what appears; nothing about the
  // content's layout/scale changes during or after it. ─────────────────
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), REFRESH_MS);
  }, []);

  return (
    // The outer plain View owns the TRUE page background (`colors.background`)
    // and never has any inset/chrome-scoped color painted on it directly.
    // Previously, `colors.backgroundSec` was set on a single `flex: 1`
    // SafeAreaView that wrapped the *entire* screen (header + scroll body),
    // which bled that tint across the whole page since the ScrollView below
    // it has no opaque background of its own. Scoping `backgroundSec` to a
    // second, non-flex SafeAreaView that only wraps the header/search/
    // category block fixes that - it's sized to its own content, so the
    // tint stops exactly where that block ends.
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView
        style={{ backgroundColor: colors.backgroundSec }}
        edges={['top']}
      >
        <Animated.View
          style={headerAnimatedStyle}
          onLayout={handleHeaderLayout}
        >
          <DeliveryHeader
            onAddressPress={() => navigation.navigate('Addresses')}
            onProfilePress={() => navigation.navigate('Profile')}
          />
        </Animated.View>

        {/* Search bar + category row: a fixed group that never hides, even
            while the header above it collapses - `paddingTop` here is a
            constant (not animated), so there's always breathing room from
            the safe-area edge regardless of the header's state. */}
        <View style={styles.stickyGroup}>
          <HomeSearchBar onPress={() => navigation.navigate('Search')} />
          <CategoryRow
            onCategoryPress={() => navigation.navigate('Categories')}
          />
        </View>
      </SafeAreaView>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabBarHeight + spacing.lg },
        ]}
      >
        <Animated.View entering={FadeInDown.duration(250)}>
          <HeroBanner onShopNow={() => {}} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(250)}>
          {isLoading ? (
            <ProductSectionSkeleton />
          ) : (
            <ProductSection
              title="Today's Offers"
              products={OFFERS}
              onViewAll={() => {}}
              onAddToCart={handleAddToCart}
              onProductPress={handleProductPress}
            />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(250)}>
          {isLoading ? (
            <ProductSectionSkeleton />
          ) : (
            <ProductSection
              title="Fresh Vegetables"
              products={VEGETABLES}
              onViewAll={() => {}}
              onAddToCart={handleAddToCart}
              onProductPress={handleProductPress}
            />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(250)}>
          {isLoading ? (
            <ProductSectionSkeleton />
          ) : (
            <ProductSection
              title="Fresh Fruits"
              products={FRUITS}
              onViewAll={() => {}}
              onAddToCart={handleAddToCart}
              onProductPress={handleProductPress}
            />
          )}
        </Animated.View>

        {/* Both sections below use DEMO data (BUY_AGAIN_EXAMPLE /
            RECOMMENDED_EXAMPLE from data/products.ts) so they're visible
            as an example - see the loud comments on those two exports and
            on BuyAgainSection/RecommendedSection themselves for what needs
            to change before this is real (real order history / real
            behavioral signals, or `[]` to hide them for new users). */}
        <Animated.View entering={FadeInDown.duration(250)}>
          <BuyAgainSection
            products={BUY_AGAIN_EXAMPLE}
            onAddToCart={handleAddToCart}
            onProductPress={handleProductPress}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(250)}>
          <RecommendedSection
            products={RECOMMENDED_EXAMPLE}
            onAddToCart={handleAddToCart}
            onProductPress={handleProductPress}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(250)}>
          <WhyFreshCartSection />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    stickyGroup: {
      backgroundColor: colors.backgroundSec,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.sm,
    },
    scroll: {
      paddingBottom: spacing.lg,
    },
  });
}
