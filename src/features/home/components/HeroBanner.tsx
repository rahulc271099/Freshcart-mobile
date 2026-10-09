import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { AppImage, Skeleton } from '@/components';
import { radius, spacing, useTheme, type ThemeColors } from '@/theme';
import type { HomeBanner } from '../types/home.types';

// ─────────────────────────────────────────────────────────────
// Layout / motion constants
// ─────────────────────────────────────────────────────────────

/** Time each banner stays put before auto-advancing. */
const AUTOPLAY_MS = 4500;
/** Centre card's width as a share of the screen - the rest is the two
 * neighbouring cards peeking in from the edges (matches the reference
 * banner design). */
const CARD_WIDTH_RATIO = 0.78;
const CARD_GAP = spacing.sm;
/** Width / height of the reference banner artwork (864 x 558). */
const CARD_ASPECT_RATIO = 864 / 558;
/** Scale of the cards either side of the centred one - interpolated
 * continuously from the scroll offset, so a swipe and an auto-advance
 * produce the exact same grow/shrink motion. */
const INACTIVE_SCALE = 0.88;
/** The list renders the banners this many times back-to-back and always
 * keeps the viewport inside the MIDDLE copy (see `normalizeIndex`), which
 * is what makes the carousel cyclic: past the last banner comes the first
 * one again, in either direction. */
const COPIES = 3;
const DOT_SIZE = 8;

type Slide = { banner: HomeBanner; key: string };

interface HeroBannerProps {
  banners: HomeBanner[] | undefined;
  isLoading: boolean;
  /** Tapped a banner whose `redirect_type` isn't `NONE`. */
  onBannerPress?: (banner: HomeBanner) => void;
}

/**
 * Home's top banner carousel, fed by `GET /api/customer/home/banners/`.
 *
 * - Cyclic: last -> first (and first -> last when swiping back) with no
 *   visible jump.
 * - Auto-advances every `AUTOPLAY_MS`; pauses while the shopper is
 *   dragging (and while Home isn't the focused tab), then resumes from
 *   wherever they stopped.
 * - Swipes and auto-advances use the same native snap scroll and the same
 *   scroll-offset-driven card scale / pagination-dot fade, so both feel
 *   identical.
 *
 * Loading shows a card-shaped skeleton; no banners (empty or failed
 * fetch) renders nothing - a blank "no banners" box would just be noise
 * on Home, and pull-to-refresh retries.
 */
export function HeroBanner({
  banners,
  isLoading,
  onBannerPress,
}: HeroBannerProps) {
  if (isLoading) return <HeroBannerSkeleton />;
  if (!banners || banners.length === 0) return null;

  // Re-key on the banner set so a refreshed/changed list re-initialises
  // the scroll position instead of leaving it pointing past the end.
  const signature = banners.map(b => b.id).join(',');
  return (
    <BannerCarousel
      key={signature}
      banners={banners}
      onBannerPress={onBannerPress}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Carousel
// ─────────────────────────────────────────────────────────────

interface BannerCarouselProps {
  banners: HomeBanner[];
  onBannerPress?: (banner: HomeBanner) => void;
}

function BannerCarousel({ banners, onBannerPress }: BannerCarouselProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth } = useWindowDimensions();
  const isFocused = useIsFocused();

  const count = banners.length;
  const isCyclic = count > 1;

  const cardWidth = Math.round(screenWidth * CARD_WIDTH_RATIO);
  const stride = cardWidth + CARD_GAP;
  // Pads the list so the first card sits centred in the viewport.
  const sidePadding = (screenWidth - stride) / 2;

  const slides = useMemo<Slide[]>(
    () =>
      Array.from({ length: isCyclic ? COPIES : 1 }, (_, copy) =>
        banners.map(banner => ({ banner, key: `${banner.id}-${copy}` })),
      ).flat(),
    [banners, isCyclic],
  );

  /** Maps any index in the repeated list to the same banner inside the
   * middle copy. */
  const normalizeIndex = useCallback(
    (index: number) => count + (((index % count) + count) % count),
    [count],
  );
  const startIndex = isCyclic ? count : 0;

  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useSharedValue(startIndex * stride);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      listRef.current?.scrollToOffset({ offset: index * stride, animated });
    },
    [stride],
  );

  // ── Autoplay ───────────────────────────────────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      // Where the viewport really is right now (works whether the last
      // move was an auto-advance or a manual swipe).
      const current = Math.round(scrollX.value / stride);
      const base = normalizeIndex(current);
      if (base !== current) {
        // Invisible re-centre: the middle copy shows the identical banner
        // at the identical on-screen position.
        scrollToIndex(base, false);
      }
      // One frame for that jump to land, then the visible, animated slide.
      requestAnimationFrame(() => {
        scrollToIndex(base + 1, true);
      });
      scheduleNext();
    }, AUTOPLAY_MS);
  }, [clearTimer, normalizeIndex, scrollToIndex, scrollX, stride]);

  useEffect(() => {
    if (!isCyclic || !isFocused) return undefined;
    scheduleNext();
    return clearTimer;
  }, [isCyclic, isFocused, scheduleNext, clearTimer]);

  // ── Scroll handling ────────────────────────────────────────
  // Re-centres into the middle copy after a swipe settles so a long run of
  // swipes in one direction can never reach the end of the repeated list.
  const handleSettled = useCallback(
    (offsetX: number) => {
      if (!isCyclic) return;
      const index = Math.round(offsetX / stride);
      const base = normalizeIndex(index);
      if (base !== index) scrollToIndex(base, false);
      if (isFocused) scheduleNext();
    },
    [isCyclic, isFocused, normalizeIndex, scheduleNext, scrollToIndex, stride],
  );

  const handleDragStart = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleDragEnd = useCallback(() => {
    if (isCyclic && isFocused) scheduleNext();
  }, [isCyclic, isFocused, scheduleNext]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const getItemLayout = useCallback(
    (_: ArrayLike<Slide> | null | undefined, index: number) => ({
      length: stride,
      offset: stride * index,
      index,
    }),
    [stride],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Slide; index: number }) => (
      <BannerSlideView
        banner={item.banner}
        index={index}
        stride={stride}
        cardWidth={cardWidth}
        scrollX={scrollX}
        onPress={onBannerPress}
      />
    ),
    [stride, cardWidth, scrollX, onBannerPress],
  );

  // A single banner has nothing to scroll to or cycle through.
  if (!isCyclic) {
    return (
      <View style={styles.staticWrap}>
        <BannerSlideView
          banner={banners[0]}
          index={0}
          stride={stride}
          cardWidth={cardWidth}
          scrollX={scrollX}
          onPress={onBannerPress}
        />
      </View>
    );
  }

  return (
    <View>
      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={slide => slide.key}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        // One banner per swipe, snapping exactly onto a card.
        snapToInterval={stride}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        initialScrollIndex={startIndex}
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleDragStart}
        onScrollEndDrag={handleDragEnd}
        onMomentumScrollEnd={event =>
          handleSettled(event.nativeEvent.contentOffset.x)
        }
        initialNumToRender={5}
        windowSize={5}
        removeClippedSubviews={false}
      />

      <View style={styles.dotsRow} accessibilityElementsHidden>
        {banners.map((banner, i) => (
          <PaginationDot
            key={banner.id}
            index={i}
            count={count}
            stride={stride}
            scrollX={scrollX}
            inactiveColor={colors.border}
            activeColor={colors.primary}
          />
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// One banner card
// ─────────────────────────────────────────────────────────────

interface BannerSlideViewProps {
  banner: HomeBanner;
  index: number;
  stride: number;
  cardWidth: number;
  scrollX: SharedValue<number>;
  onPress?: (banner: HomeBanner) => void;
}

const BannerSlideView = memo(function BannerSlideCard({
  banner,
  index,
  stride,
  cardWidth,
  scrollX,
  onPress,
}: BannerSlideViewProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Grows to full size as it nears the centre, shrinks as it leaves -
  // computed from the live scroll offset on the UI thread, so it tracks a
  // finger drag and a programmatic slide frame-for-frame.
  const animatedStyle = useAnimatedStyle(() => {
    const centre = index * stride;
    const scale = interpolate(
      scrollX.value,
      [centre - stride, centre, centre + stride],
      [INACTIVE_SCALE, 1, INACTIVE_SCALE],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  const tappable = banner.redirect_type !== 'NONE' && onPress != null;

  return (
    <Animated.View style={[styles.slide, { width: stride }, animatedStyle]}>
      <Pressable
        style={[styles.card, { width: cardWidth }]}
        disabled={!tappable}
        onPress={() => onPress?.(banner)}
        accessibilityRole={tappable ? 'button' : 'image'}
        accessibilityLabel={banner.title}
      >
        <AppImage
          source={{ uri: banner.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      </Pressable>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────
// Pagination dot
// ─────────────────────────────────────────────────────────────

interface PaginationDotProps {
  index: number;
  count: number;
  stride: number;
  scrollX: SharedValue<number>;
  inactiveColor: string;
  activeColor: string;
}

function PaginationDot({
  index,
  count,
  stride,
  scrollX,
  inactiveColor,
  activeColor,
}: PaginationDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    // Position within the repeated list -> position within one pass of the
    // banners, then the shortest (wrap-around) distance to this dot, so the
    // highlight hands over smoothly from the last dot to the first.
    const position = scrollX.value / stride;
    const within = ((position % count) + count) % count;
    const rawDistance = Math.abs(within - index);
    const distance = Math.min(rawDistance, count - rawDistance);
    const progress = Math.max(0, 1 - distance);
    return {
      backgroundColor: interpolateColor(
        progress,
        [0, 1],
        [inactiveColor, activeColor],
      ),
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────

/** Card-shaped placeholder with the same dimensions as a real banner, so
 * the swap to content doesn't shift anything below it. */
export function HeroBannerSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.round(screenWidth * CARD_WIDTH_RATIO);

  return (
    <View>
      <View style={styles.staticWrap}>
        <View style={styles.slide}>
          <Skeleton
            width={cardWidth}
            height={Math.round(cardWidth / CARD_ASPECT_RATIO)}
            borderRadius={radius.lg}
          />
        </View>
      </View>
      <View style={styles.dotsRow}>
        <Skeleton
          width={DOT_SIZE * 3}
          height={DOT_SIZE}
          borderRadius={DOT_SIZE / 2}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    staticWrap: {
      alignItems: 'center',
    },
    slide: {
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    card: {
      aspectRatio: CARD_ASPECT_RATIO,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm - 2,
      paddingHorizontal: spacing.md,
      marginTop: spacing.xs,
    },
  });
}
