import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import { OfferBadge } from '@/components';
import { icons } from '@/constants/icons';
import { radius, shadows, spacing, useTheme, type ThemeColors } from '@/theme';

interface ProductImageCarouselProps {
  images: string[];
  discountPercent?: number;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  onShare: () => void;
}

const IMAGE_HEIGHT = 340;

/**
 * Product Details' hero image area: paginated gallery + discount ribbon +
 * wishlist/share buttons, all overlaid on one `colors.backgroundSec` block
 * (matches the reference design - these aren't part of the screen's plain
 * top nav row above it).
 */
export function ProductImageCarousel({
  images,
  discountPercent,
  isWishlisted,
  onToggleWishlist,
  onShare,
}: ProductImageCarouselProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        keyExtractor={(uri, index) => `${uri}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={[styles.image, { width }]}
            resizeMode="contain"
          />
        )}
      />

      {discountPercent != null && (
        <OfferBadge percent={discountPercent} style={styles.discountBadge} />
      )}

      <View style={styles.topRightActions}>
        <Pressable
          style={styles.actionBtn}
          onPress={onToggleWishlist}
          hitSlop={8}
          accessibilityLabel={
            isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
          }
        >
          <icons.wishlist
            color={isWishlisted ? colors.error : colors.textPrimary}
            fill={isWishlisted ? colors.error : 'transparent'}
            size={18}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={onShare}
          hitSlop={8}
          accessibilityLabel="Share this product"
        >
          <icons.share color={colors.textPrimary} size={18} strokeWidth={2} />
        </Pressable>
      </View>

      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((uri, index) => (
            <View
              key={`${uri}-${index}`}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSec,
      paddingTop: spacing.md,
    },
    image: {
      height: IMAGE_HEIGHT,
    },
    discountBadge: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      zIndex: 1,
    },
    topRightActions: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      zIndex: 1,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    dots: {
      flexDirection: 'row',
      alignSelf: 'center',
      gap: 6,
      paddingBottom: spacing.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radius.full,
      backgroundColor: colors.border,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 16,
    },
  });
}
