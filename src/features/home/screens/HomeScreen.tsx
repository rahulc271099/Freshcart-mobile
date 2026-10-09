import React, { useCallback, useMemo, useState } from 'react';
import { Linking, RefreshControl, StyleSheet, View } from 'react-native';
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
import { CategoryRow, type CategoryRowItem } from '../components/CategoryRow';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/reactQueryKeys';
import { useGroups } from '@/features/categories/hooks/useGroups';
import { useSelectedDeliveryArea } from '@/features/location/hooks/useDeliveryLocation';
import { DeliveryHeader } from '../components/DeliveryHeader';
import { HeroBanner } from '../components/HeroBanner';
import { HomeSearchBar } from '../components/HomeSearchBar';
import { CampaignSections } from '../components/CampaignSections';
import { HomeSectionError } from '../components/HomeSectionError';
import { ProductSectionSkeleton } from '../components/ProductCardSkeleton';
import { WhyFreshCartSection } from '../components/WhyFreshCartSection';
import { useAddProductToCart } from '../hooks/useAddProductToCart';
import { useHomeBanners, useHomeCampaigns } from '../hooks/useHomeContent';
import type { HomeBanner, HomeCampaign } from '../types/home.types';
import type { Product } from '@/components';

/** Scroll delta (px) needed to trigger a hide/show, so tiny jitters don't. */
const SCROLL_THRESHOLD = 10;
/** Show/hide transition duration - matches AppTabs.tsx's own tab-switch reset. */
const VISIBILITY_DURATION = 220;
type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Home'>,
  NativeStackNavigationProp<MainStackParamList>
>;

/** How many groups Home shows before the "More" tile. */
const HOME_GROUP_LIMIT = 4;

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

  // Real home content (see features/home/api/homeApi.ts) - four
  // independent queries so one slow/failed section never blocks the rest.
  const banners = useHomeBanners();
  // Home's strip shows the catalogue groups (same data as the Categories
  // sidebar) rather than the admin-featured categories endpoint.
  const categories = useGroups();
  const groupTiles = useMemo<CategoryRowItem[]>(
    () =>
      (categories.data ?? []).slice(0, HOME_GROUP_LIMIT).map(group => ({
        id: group.group_id,
        label: group.display_name || group.name,
        imageUrl: group.image_url,
      })),
    [categories.data],
  );
  // Campaign sections (GET /customer/campaigns?placement=HOME_SECTION) -
  // each campaign then loads its own products, see `CampaignSections`.
  const campaigns = useHomeCampaigns();
  console.log("🚀 ~ HomeScreen ~ campaigns:", campaigns)

  // ── Delivery location ─────────────────────────────────────────────────
  // `MainNavigator` never renders Home until an area is saved (see its
  // location gate), so this is only the header label; tapping it re-opens
  // the picker to change area.
  const selectedArea = useSelectedDeliveryArea();
  let deliveryAddressLabel = 'Select delivery location';
  if (selectedArea.data) {
    deliveryAddressLabel = `${selectedArea.data.name}, ${selectedArea.data.pincode}`;
  } else if (selectedArea.isLoading) {
    deliveryAddressLabel = 'Locating…';
  }

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

  const handleAddToCart = useAddProductToCart();

  // Real catalogue products (campaign sections) - ids are real
  // product ids, so ProductDetails can load them.
  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetails', { productId: product.id });
    },
    [navigation],
  );

  // Where a banner tap goes, by the backend's own `redirect_type`.
  // OFFER has no destination screen in the app yet, so it's a no-op for now.
  const handleBannerPress = useCallback(
    (banner: HomeBanner) => {
      switch (banner.redirect_type) {
        case 'PRODUCT':
        case 'COMBO':
          if (banner.redirect_id != null) {
            navigation.navigate('ProductDetails', {
              productId: String(banner.redirect_id),
            });
          }
          break;
        case 'CAMPAIGN':
          if (banner.redirect_id != null) {
            navigation.navigate('CampaignProducts', {
              campaignId: banner.redirect_id,
              title: banner.title,
            });
          }
          break;
        case 'CATEGORY':
          navigation.navigate('Categories');
          break;
        case 'URL':
          // Only ever hand http(s) links to the OS - this string is
          // admin-entered content, not something to trust blindly.
          if (
            banner.redirect_url &&
            /^https?:\/\//i.test(banner.redirect_url)
          ) {
            Linking.openURL(banner.redirect_url).catch(error => {
              console.warn('[HomeScreen] could not open banner URL', error);
            });
          }
          break;
        default:
          break;
      }
    },
    [navigation],
  );

  const handleSeeAll = useCallback(
    (campaign: HomeCampaign) => {
      navigation.navigate('CampaignProducts', {
        campaignId: campaign.id,
        title: campaign.campaign_name,
      });
    },
    [navigation],
  );

  // ── Pull-to-refresh: re-fetches all four home queries for real. Native
  // indicator only, no card/image stretching - RefreshControl's own
  // spinner is what appears; nothing about the content's layout/scale
  // changes during or after it. ─────────────────────────────────────────
  const { refetch: refetchBanners } = banners;
  const { refetch: refetchCategories } = categories;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchBanners(),
        refetchCategories(),
        // The campaign list and every campaign's products (shared prefix).
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.HOME.campaigns(),
        }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetchBanners, refetchCategories]);

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
            address={deliveryAddressLabel}
            onAddressPress={() => navigation.navigate('SelectLocation')}
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
            items={groupTiles}
            isLoading={categories.isLoading}
            // A tile opens Categories with that group preselected; "More"
            // opens it on its default (first) group.
            onItemPress={groupId =>
              navigation.navigate('Categories', { groupId })
            }
            onMorePress={() => navigation.navigate('Categories')}
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
          <HeroBanner
            banners={banners.data}
            isLoading={banners.isLoading}
            onBannerPress={handleBannerPress}
          />
        </Animated.View>

        {/* Campaigns - GET /api/customer/campaigns?placement=HOME_SECTION,
            in the server's display order. While the list loads one skeleton
            stands in for the sections to come; each campaign then loads
            (and fails) on its own. */}
        {campaigns.isLoading ? (
          <ProductSectionSkeleton />
        ) : campaigns.isError && !campaigns.data ? (
          <HomeSectionError
            title="Featured"
            onRetry={() => campaigns.refetch()}
          />
        ) : (
          <Animated.View entering={FadeInDown.duration(250)}>
            <CampaignSections
              campaigns={campaigns.data}
              onSeeAll={handleSeeAll}
              onAddToCart={handleAddToCart}
              onProductPress={handleProductPress}
            />
          </Animated.View>
        )}

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
