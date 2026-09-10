import React, { useEffect, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useCartStore } from '@/store/cartStore';
import { fonts, radius, shadows, useTheme, type ThemeColors } from '@/theme';

/** Pill width when idle (qty 0) - a plain circle. */
const COLLAPSED_WIDTH = 28;
/** Pill width once it holds "− qty +" - wide enough for a double-digit
 * count without crowding. */
const EXPANDED_WIDTH = 68;
const PILL_HEIGHT = 28;
const ANIMATION_MS = 200;

export interface AddToCartControlProps {
  productId: string;
  /** Only used for accessibility labels ("Add Tomato to cart", ...). */
  productName: string;
  /** `true` = solid primary pill with white icons (Home's `ProductCard`);
   * `false` = white pill with a primary border/icons (Categories'
   * `CategoryProductCard`). Defaults to `true`. */
  filled?: boolean;
  /** Applied directly to the pill's own root view - this is how each
   * caller positions it (Home's bottom-right image-corner offset,
   * Categories' image/info-boundary overlap offset). This component only
   * owns the pill's look and the add/remove/quantity behavior, never its
   * placement within a card. */
  style?: StyleProp<ViewStyle>;
  /** Optional side-effect callback (e.g. analytics), fired only on the
   * very first add (qty 0 -> 1) - the real cart mutation always happens
   * internally via `useCartStore` regardless, so this stays in sync with
   * the cart without the parent needing to thread quantity/handlers down. */
  onAdd?: () => void;
}

/**
 * Shared "+" / quantity-stepper pill, used by both `ProductCard` (Home)
 * and `CategoryProductCard` (Categories) - Categories previously had its
 * own separate, static, unanimated "+" button with no cart-quantity
 * feedback at all. Extracted here so both features share one real
 * implementation instead of silently drifting apart; `filled` is the only
 * visual fork between them - sizing, animation and behavior are identical.
 *
 * The pill widens/narrows via a plain eased `withTiming` - deliberately
 * NOT `withSpring` (no bounce/overshoot) per explicit request. The plus
 * button stays pinned to the pill's right edge (`justifyContent:
 * 'flex-end'` + `overflow: 'hidden'` below) so it never visually moves;
 * the minus button and quantity text simply reveal or get clipped away to
 * its left as the width animates between `COLLAPSED_WIDTH` and
 * `EXPANDED_WIDTH`.
 */
export function AddToCartControl({
  productId,
  productName,
  filled = true,
  style,
  onAdd,
}: AddToCartControlProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const quantity = useCartStore(
    state => state.items.find(i => i.productId === productId)?.quantity ?? 0,
  );
  const addItem = useCartStore(state => state.addItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);

  const expanded = useSharedValue(quantity > 0 ? 1 : 0);
  useEffect(() => {
    expanded.value = withTiming(quantity > 0 ? 1 : 0, {
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [quantity, expanded]);

  const widthAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(
      expanded.value,
      [0, 1],
      [COLLAPSED_WIDTH, EXPANDED_WIDTH],
    ),
  }));

  const handleAdd = () => {
    addItem(productId);
    onAdd?.();
  };
  const handleIncrement = () => updateQuantity(productId, quantity + 1);
  const handleDecrement = () => updateQuantity(productId, quantity - 1);

  const iconColor = filled ? '#fff' : colors.primary;

  return (
    <Animated.View
      style={[
        styles.pill,
        filled ? styles.pillFilled : styles.pillOutlined,
        style,
        widthAnimatedStyle,
      ]}
    >
      <Pressable
        style={styles.stepBtn}
        onPress={handleDecrement}
        hitSlop={6}
        accessibilityLabel={`Remove one ${productName}`}
      >
        <Minus color={iconColor} size={12} strokeWidth={3} />
      </Pressable>
      <Text style={[styles.stepQty, { color: iconColor }]}>{quantity}</Text>
      <Pressable
        style={styles.stepBtn}
        onPress={quantity === 0 ? handleAdd : handleIncrement}
        hitSlop={6}
        accessibilityLabel={
          quantity === 0
            ? `Add ${productName} to cart`
            : `Add one more ${productName}`
        }
      >
        <Plus color={iconColor} size={14} strokeWidth={3} />
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pill: {
      height: PILL_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
      borderRadius: radius.full,
      paddingHorizontal: 6,
      overflow: 'hidden',
      ...shadows.sm,
    },
    pillFilled: {
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.background,
    },
    pillOutlined: {
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    stepBtn: {
      width: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepQty: {
      fontSize: 11,
      fontFamily: fonts.bold,
      minWidth: 16,
      textAlign: 'center',
    },
  });
}
