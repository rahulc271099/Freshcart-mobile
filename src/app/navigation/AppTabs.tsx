import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomTabBar,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ShoppingCart } from 'lucide-react-native';
import type {
  BottomTabBarButtonProps,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { icons } from '@/constants/icons';
import { CartScreen } from '@/features/cart/screens/CartScreen';
import { useCartItems } from '@/features/cart/hooks/useCartItems';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { CategoriesScreen } from '@/features/categories/screens/CategoriesScreen';
import {
  dimensions,
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';
import type { AppTabsParamList } from './navigationTypes';
import { useTabBarVisibility } from './TabBarVisibilityContext';

const Tab = createBottomTabNavigator<AppTabsParamList>();

/** Pill content height (not counting the top/bottom padding around icons). */
const BAR_HEIGHT = 68;
/** Cart circle diameter. */
const CIRCLE_SIZE = 60;
/** How far the circle's top edge sits above the pill's own top edge. */
const CIRCLE_LIFT = 24;

// ─── Tab icon helpers ─────────────────────────────────────────────────────────
// Defined at module scope so React Navigation gets a stable reference across
// renders (avoids react/no-unstable-nested-components warning + icon remounts).

function HomeTabIcon({ color }: { color: string }) {
  return <icons.home color={color} size={dimensions.iconSize.md} />;
}

function CategoriesTabIcon({ color }: { color: string }) {
  return <icons.categories color={color} size={dimensions.iconSize.md} />;
}

// Same reasoning as the icon helpers above - a stable module-scope reference
// instead of an inline arrow in `tabBarButton`, so React Navigation doesn't
// see a new component type (and remount the button) on every render.
function CartTabBarButton(props: BottomTabBarButtonProps) {
  return <FloatingCartButton {...props} />;
}

// ─── Floating cart button ─────────────────────────────────────────────────────

/**
 * Custom `tabBarButton` for the Cart tab - unchanged from before: the green
 * circle pokes above the bar's top edge, with its own "Cart" label. Only the
 * bar it sits on top of changed (a plain floating pill now, not a bar with a
 * notch cut into it), so this component didn't need to change.
 */
function FloatingCartButton(props: BottomTabBarButtonProps) {
  const { onPress } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createFloatStyles(colors), [colors]);
  // Real count now (was a hardcoded `MOCK_CART_COUNT = 3`) - `useCartItems`
  // already joins the cart store against the product catalog for
  // CartScreen/CartBar, so this stays in sync with both automatically.
  const { itemCount } = useCartItems();

  // Pulse the badge (scale 1 -> 1.15/1.18 -> 1, ~200ms total) whenever the
  // count changes - communicates "the cart just changed" without a full
  // re-render animation of the whole button. Skips the very first mount
  // (nothing "changed" yet) via the `didMount` ref below.
  const badgeScale = useSharedValue(1);
  const didMount = React.useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    badgeScale.value = withSequence(
      withSpring(1.18, { duration: 100 }),
      withSpring(1, { duration: 100 }),
    );
  }, [itemCount, badgeScale]);
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.circleWrap} pointerEvents="box-none">
        <Pressable style={styles.circle} onPress={onPress ?? undefined}>
          <ShoppingCart color={colors.textInverse} size={26} strokeWidth={2} />
          {itemCount > 0 && (
            <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </Animated.View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function createFloatStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      alignItems: 'center',
    },
    circleWrap: {
      position: 'absolute',
      top: -CIRCLE_LIFT,
      alignItems: 'center',
    },
    circle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.md,
      shadowColor: colors.primary,
    },
    label: {
      marginTop: 4,
      fontSize: 10,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.background,
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
      ...shadows.sm,
    },
    badgeText: {
      color: colors.primary,
      fontSize: 10,
      fontFamily: fonts.bold,
      lineHeight: 14,
    },
  });
}

// ─── Animated tab bar wrapper ─────────────────────────────────────────────────
// Scroll-driven show/hide (see HomeScreen.tsx) needs the bar's own render to
// react to a Reanimated value every frame - `tabBarStyle` alone can't do
// that, it's a plain style object read once by React Navigation's default
// renderer. Taking over via the `tabBar` prop and wrapping the *same*
// `BottomTabBar` in an `Animated.View` keeps all default rendering/behavior
// (icons, labels, the custom Cart button) and only adds the slide/fade.
//
// The floating position (`left`/`right`/`bottom`) moves here, onto this
// wrapper, instead of living in `tabBarStyle` below - this wrapper is what
// needs `position: 'absolute'` to overlay screen content; `tabBarStyle`
// keeps only the bar's own visual styling (size, background, border,
// shadow), which `BottomTabBar` still applies internally same as before.
const barWrapperStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
});

interface AnimatedTabBarProps extends BottomTabBarProps {
  barBottom: number;
  barSide: number;
}

function AnimatedTabBar({ barBottom, barSide, ...props }: AnimatedTabBarProps) {
  const visibility = useTabBarVisibility();

  // Switching tabs resets visibility based on the *new* active tab, rather
  // than always resetting to visible - Cart hides the pill entirely (it has
  // its own checkout footer at the true bottom instead, and there's no
  // scroll-driven hide to fight with there); every other tab resets to
  // visible, same as before, with HomeScreen's scroll handler then taking
  // over from there.
  useEffect(() => {
    const activeRouteName = props.state.routes[props.state.index]?.name;
    const shouldHide = activeRouteName === 'Cart';
    visibility.value = withTiming(shouldHide ? 0 : 1, { duration: 220 });
  }, [props.state.index, props.state.routes, visibility]);

  const animatedStyle = useAnimatedStyle(() => {
    // Travel distance = bar height + its floating offset, so it slides
    // fully clear of the screen rather than just fading in place.
    const travel = BAR_HEIGHT + barBottom + spacing.lg;
    return {
      opacity: visibility.value,
      transform: [
        { translateY: interpolate(visibility.value, [0, 1], [travel, 0]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        barWrapperStyles.wrapper,
        { left: barSide, right: barSide, bottom: barBottom },
        animatedStyle,
      ]}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

// ─── AppTabs ──────────────────────────────────────────────────────────────────

export function AppTabs() {
  const { colors, dark } = useTheme();
  // Safe-area-aware floating offset - a fixed `bottom: spacing.md` (the old
  // approach) sits flush against whatever the device's home-indicator inset
  // is, which is fine on devices with none but crowds/overlaps the home
  // indicator on notched/gesture-nav devices. Adding `insets.bottom` lifts
  // the pill clear of that zone consistently across devices, while still
  // keeping the same `spacing.md` breathing room above it.
  const insets = useSafeAreaInsets();
  const barBottom = insets.bottom;
  // Reduced by 8 on each side: spacing.md (16) -> spacing.lg (24).
  const barSide = spacing.lg;

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => (
      <AnimatedTabBar {...props} barBottom={barBottom} barSide={barSide} />
    ),
    [barBottom, barSide],
  );

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.semiBold,
          marginBottom: 2,
        },
        // Only visual styling here now - position/left/right/bottom moved
        // onto `AnimatedTabBar`'s wrapper above, which is what needs to be
        // `position: 'absolute'` to overlay screen content. `BottomTabBar`
        // still reads and applies this object internally, so nothing here
        // needs `useBottomTabBarHeight()` callers to change.
        tabBarStyle: {
          height: BAR_HEIGHT,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: colors.background,
          borderRadius: radius.xlg,
          borderWidth: 1,
          borderColor: colors.border,
          // All-directional shadow, not the shared `shadows` scale - those
          // tokens are offset downward (a shadow "underneath"), which reads
          // as resting on the ground. A pill floating with margin on every
          // side needs a shadow that reads as lifted on every side too.
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: dark ? 0.45 : 0.15,
          shadowRadius: 16,
          elevation: 12,
          // Let the floating cart button overflow above the pill's top edge.
          overflow: 'visible',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: HomeTabIcon, tabBarLabel: 'Home' }}
      />

      {/* Cart — floating green circle above the pill, own label */}
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: CartTabBarButton,
        }}
      />

      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ tabBarIcon: CategoriesTabIcon, tabBarLabel: 'Categories' }}
      />
    </Tab.Navigator>
  );
}
