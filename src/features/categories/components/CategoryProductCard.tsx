import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bookmark } from 'lucide-react-native';

import { AddToCartControl, OfferBadge } from '@/components';
import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

export interface CategoryProduct {
  id: string;
  name: string;
  imageUri: string;
  discountPercent: number;
  originalPrice: number;
  price: number;
  pricePerUnit: string; // e.g. "₹7.2/100g"
  defaultUnit: string; // e.g. "500g"
  otherUnits: string[]; // e.g. ["2 x 500g"]
  deliveryMins: number;
}

interface CategoryProductCardProps {
  product: CategoryProduct;
  onAddToCart?: (product: CategoryProduct) => void;
  onPress?: (product: CategoryProduct) => void;
}

const IMAGE_HEIGHT = 140;

export function CategoryProductCard({
  product,
  onAddToCart,
  onPress,
}: CategoryProductCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(product)}>
      {/* ── Image section ──────────────────────────────── */}
      <View style={styles.imageWrap}>
        <OfferBadge
          percent={product.discountPercent}
          style={styles.discountBadge}
        />

        {/* Bookmark */}
        <Pressable style={styles.bookmark} hitSlop={8}>
          <Bookmark color={colors.textSecondary} size={14} strokeWidth={1.5} />
        </Pressable>

        <Image
          source={{ uri: product.imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* ── Info section ───────────────────────────────── */}
      <View style={styles.info}>
        {/* Delivery time */}
        <View style={styles.deliveryRow}>
          <View style={styles.deliveryDot} />
          <Text style={styles.deliveryText}>{product.deliveryMins} MINS</Text>
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Weight pills */}
        <View style={styles.unitsRow}>
          <View style={styles.unitPillActive}>
            <Text style={styles.unitTextActive}>{product.defaultUnit}</Text>
          </View>
          {product.otherUnits.map(u => (
            <View key={u} style={styles.unitPill}>
              <Text style={styles.unitText}>{u}</Text>
            </View>
          ))}
        </View>

        {/* Discount label */}
        <Text style={styles.discountLabel}>{product.discountPercent}% OFF</Text>

        {/* Price row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.originalPrice}> ₹{product.originalPrice}</Text>
        </View>

        {/* Per-unit price */}
        <Text style={styles.perUnit}>{product.pricePerUnit}</Text>
      </View>

      {/* Same shared add/quantity control `ProductCard` (Home) uses - see
          `AddToCartControl`'s own comment. `filled={false}` is what keeps
          this one matching Categories' original white/outlined look
          instead of Home's solid pill. A direct child of `card` (not
          `imageWrap`) positioned by its offset from the top of the card,
          so it can hang over the image/info boundary without being
          clipped by imageWrap's `overflow: hidden` (which it needs, to
          clip the image and the discount badge/bookmark to the rounded
          top corners). */}
      <AddToCartControl
        productId={product.id}
        productName={product.name}
        filled={false}
        style={styles.addBtn}
        onAdd={() => onAddToCart?.(product)}
      />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'visible',
      ...shadows.sm,
    },
    imageWrap: {
      height: IMAGE_HEIGHT,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      position: 'relative',
    },
    discountBadge: {
      position: 'absolute',
      top: spacing.xs,
      left: spacing.xs,
      zIndex: 1,
    },
    bookmark: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      zIndex: 1,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    // Positioned relative to `card`, not `imageWrap` - see the comment at
    // the JSX usage above for why. Look (background/border/radius/size) is
    // now owned by `AddToCartControl` itself - this only positions it.
    addBtn: {
      position: 'absolute',
      top: IMAGE_HEIGHT - 14,
      right: spacing.sm,
      zIndex: 5,
      elevation: 5, // Android needs this too - zIndex alone doesn't stack above sibling Views there.
    },
    info: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.md + 2,
      paddingBottom: spacing.sm,
    },
    deliveryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 3,
    },
    deliveryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    deliveryText: {
      fontSize: 9,
      color: colors.textSecondary,
      fontFamily: fonts.semiBold,
      letterSpacing: 0.3,
    },
    name: {
      fontSize: 12,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      lineHeight: 16,
    },
    unitsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: spacing.xs,
    },
    unitPillActive: {
      backgroundColor: '#EEF5EC',
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    unitTextActive: {
      color: colors.primary,
      fontSize: 9,
      fontFamily: fonts.bold,
    },
    unitPill: {
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    unitText: {
      color: colors.textSecondary,
      fontSize: 9,
    },
    discountLabel: {
      color: colors.primary,
      fontSize: 11,
      fontFamily: fonts.bold,
      marginTop: spacing.xs,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 1,
    },
    price: {
      fontSize: 14,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
    },
    originalPrice: {
      fontSize: 11,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    perUnit: {
      fontSize: 9,
      color: colors.textSecondary,
      marginTop: 1,
    },
  });
}
