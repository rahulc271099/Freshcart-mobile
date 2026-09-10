import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AddToCartControl, OfferBadge } from '@/components';
import { useWishlistStore } from '@/store/wishlistStore';
import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

const CARD_WIDTH = 130;
const IMAGE_HEIGHT = 110;

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUri: string;
  discountPercent?: number;
  /**
   * Single non-discount badge, mutually exclusive with `discountPercent` -
   * only one badge is ever shown on a card (never stacked), so a product
   * with both set still renders just `badgeOverride`.
   */
  badgeOverride?: 'NEW' | 'BEST_SELLER';
  /** Defaults to `true` when omitted - most dummy products don't set this. */
  inStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  /** Optional side-effect callback (e.g. analytics) - the actual cart
   * mutation happens internally via `AddToCartControl` -> `useCartStore`
   * regardless, so the quantity stepper stays in sync with the real cart
   * without this component needing to thread quantity/handlers down. */
  onAddToCart?: (product: Product) => void;
  onPress?: (product: Product) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  onPress,
}: ProductCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inStock = product.inStock !== false;

  const isWishlisted = useWishlistStore(state =>
    state.isWishlisted(product.id),
  );
  const toggleWishlist = useWishlistStore(state => state.toggle);

  // ── Press feedback (card): 1.00 -> 0.97 -> 1.00 ──────────────────────
  const pressScale = useSharedValue(1);
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));
  const handlePressIn = () => {
    pressScale.value = withTiming(0.97, { duration: 100 });
  };
  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 100 });
  };

  // ── Wishlist heart scale bounce on toggle ────────────────────────────
  const heartScale = useSharedValue(1);
  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  const handleToggleWishlist = () => {
    heartScale.value = withSequence(
      withSpring(1.3, { duration: 150 }),
      withSpring(1, { duration: 150 }),
    );
    toggleWishlist(product.id);
  };

  return (
    <Animated.View style={[styles.card, cardAnimatedStyle]}>
      <Pressable
        onPress={() => onPress?.(product)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* ── Image / action area ────────────────────────── */}
        <View style={styles.imageWrap}>
          {inStock && product.badgeOverride ? (
            <View style={[styles.textBadge, styles.topLeftBadge]}>
              <Text style={styles.textBadgeLabel}>
                {product.badgeOverride === 'NEW' ? 'NEW' : 'BEST SELLER'}
              </Text>
            </View>
          ) : inStock && product.discountPercent != null ? (
            <OfferBadge
              percent={product.discountPercent}
              style={styles.topLeftBadge}
            />
          ) : null}

          <Animated.View style={[styles.heartBtn, heartAnimatedStyle]}>
            <Pressable
              onPress={handleToggleWishlist}
              hitSlop={8}
              accessibilityLabel={
                isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
              }
            >
              <Heart
                color={isWishlisted ? colors.error : colors.textSecondary}
                fill={isWishlisted ? colors.error : 'transparent'}
                size={14}
                strokeWidth={2}
              />
            </Pressable>
          </Animated.View>

          <Image
            source={{ uri: product.imageUri }}
            style={[styles.image, !inStock && styles.imageOutOfStock]}
            resizeMode="contain"
          />

          {!inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of stock</Text>
            </View>
          )}

          {/* Add / quantity pill lives in this bottom-right corner of the
              image area - deliberately NOT in the info area below, so it
              expanding never overlaps the name/price/weight text. Same
              shared control Categories' `CategoryProductCard` uses (see
              `AddToCartControl`'s own comment) - `filled` (the default)
              is what makes this one a solid pill instead of Categories'
              white/outlined one. */}
          {inStock && (
            <AddToCartControl
              productId={product.id}
              productName={product.name}
              style={styles.actionCorner}
              onAdd={() => onAddToCart?.(product)}
            />
          )}
        </View>

        {/* ── Info area - name/price/unit only, never touched by the
            add/quantity control above ──────────────────────────── */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText} numberOfLines={1}>
              <Text style={styles.priceAmount}>₹{product.price}</Text>
              <Text style={styles.priceUnit}> / {product.unit}</Text>
            </Text>

            {!inStock && (
              <Pressable hitSlop={8} onPress={() => {}}>
                <Text style={styles.notifyText}>Notify me</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    imageWrap: {
      width: '100%',
      height: IMAGE_HEIGHT,
      backgroundColor: colors.surface,
    },
    topLeftBadge: {
      position: 'absolute',
      top: spacing.xs,
      left: spacing.xs,
      zIndex: 1,
    },
    textBadge: {
      backgroundColor: colors.primary,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    textBadgeLabel: {
      color: colors.textInverse,
      fontSize: 8,
      fontFamily: fonts.bold,
      lineHeight: 10,
    },
    heartBtn: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      zIndex: 1,
      width: 22,
      height: 22,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageOutOfStock: {
      opacity: 0.4,
    },
    outOfStockOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      paddingVertical: 4,
      backgroundColor: colors.overlay,
    },
    outOfStockText: {
      color: colors.textInverse,
      fontSize: 9,
      fontFamily: fonts.semiBold,
    },
    // Bottom-right corner of the image area - the one place the add/
    // quantity control lives, entirely separate from the info area below.
    actionCorner: {
      position: 'absolute',
      bottom: spacing.xs,
      right: spacing.xs,
      zIndex: 1,
    },
    info: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs + 2,
      paddingBottom: spacing.sm,
    },
    name: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.textPrimary,
      lineHeight: 16,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    priceText: {
      flex: 1,
    },
    priceAmount: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    priceUnit: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    notifyText: {
      fontSize: 10,
      fontFamily: fonts.semiBold,
      color: colors.primary,
    },
  });
}
