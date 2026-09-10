import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

interface BannerSlide {
  id: string;
  pill: string;
  title: string;
  subtitle: string;
  discountLine1: string;
  discountLine2: string;
  discountLine3: string;
  imageUri: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: 'farm-fresh',
    pill: "TODAY'S PICK",
    title: 'Farm Fresh\nGoodness',
    subtitle: 'Handpicked fruits &\nvegetables at best prices',
    discountLine1: 'UP TO',
    discountLine2: '30%',
    discountLine3: 'OFF',
    imageUri:
      'https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80',
  },
  {
    id: 'weekly-deal',
    pill: 'WEEKLY DEAL',
    title: 'Fresh &\nAffordable',
    subtitle: 'Everyday essentials at\neveryday low prices',
    discountLine1: 'UP TO',
    discountLine2: '25%',
    discountLine3: 'OFF',
    imageUri:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
  },
  {
    id: 'fruit-fest',
    pill: 'LIMITED TIME',
    title: 'Juicy Fruit\nFest',
    subtitle: 'Seasonal fruits at\nunbeatable prices',
    discountLine1: 'UP TO',
    discountLine2: '40%',
    discountLine3: 'OFF',
    imageUri:
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&q=80',
  },
];

/** How often the carousel auto-advances. */
const AUTOPLAY_MS = 5000;
const SLIDE_WIDTH = Dimensions.get('window').width;

interface HeroBannerProps {
  onShopNow?: (slide: BannerSlide) => void;
}

/**
 * Promotional banner carousel - same card structure/content as the original
 * single static banner (pill, title, subtitle, one CTA, product image,
 * pagination dots), now with 3 slides that auto-rotate and support manual
 * swipe. Paging is done with a plain `ScrollView` (`pagingEnabled`, full
 * screen-width pages with the card inset via padding rather than margin,
 * so `pagingEnabled`'s page-width math stays exact) rather than a 3rd-party
 * carousel dependency.
 */
export function HeroBanner({ onShopNow }: HeroBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Re-armed every time `activeIndex` changes (manual swipe included), so a
  // manual swipe doesn't fight with an auto-advance landing moments later.
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextIndex = (activeIndex + 1) % SLIDES.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * SLIDE_WIDTH,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
      setActiveIndex(index);
    },
    [],
  );

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {SLIDES.map(slide => (
          <View key={slide.id} style={styles.page}>
            <View style={styles.card}>
              {/* ── Left content ──────────────────────────────── */}
              <View style={styles.left}>
                <View style={styles.todayPill}>
                  <Text style={styles.todayText}>{slide.pill}</Text>
                </View>

                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>

                <Pressable
                  style={styles.shopBtn}
                  onPress={() => onShopNow?.(slide)}
                >
                  <Text style={styles.shopBtnText}>Shop Now →</Text>
                </Pressable>
              </View>

              {/* ── Right image + discount circle ─────────────── */}
              <View style={styles.right}>
                <View style={styles.discountCircle}>
                  <Text style={styles.discountLine1}>
                    {slide.discountLine1}
                  </Text>
                  <Text style={styles.discountLine2}>
                    {slide.discountLine2}
                  </Text>
                  <Text style={styles.discountLine3}>
                    {slide.discountLine3}
                  </Text>
                </View>

                <Image
                  source={{ uri: slide.imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── Pagination dots ────────────────────────────── */}
      <View style={styles.dotsRow}>
        {SLIDES.map((slide, index) => (
          <View
            key={slide.id}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    page: {
      width: SLIDE_WIDTH,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    card: {
      backgroundColor: colors.backgroundSec,
      borderRadius: radius.lg,
      height: 195,
      flexDirection: 'row',
      overflow: 'hidden',
      ...shadows.sm,
    },
    left: {
      flex: 1,
      paddingLeft: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      justifyContent: 'flex-start',
    },
    todayPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.background,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      marginBottom: spacing.sm,
    },
    todayText: {
      fontSize: 9,
      fontFamily: fonts.bold,
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 22,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      lineHeight: 27,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 16,
      marginTop: spacing.xs,
    },
    shopBtn: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    shopBtnText: {
      color: '#fff',
      fontSize: 12,
      fontFamily: fonts.semiBold,
    },
    right: {
      width: 165,
      position: 'relative',
    },
    discountCircle: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 2,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    discountLine1: {
      color: '#fff',
      fontSize: 8,
      fontFamily: fonts.medium,
      lineHeight: 11,
    },
    discountLine2: {
      color: '#fff',
      fontSize: 17,
      fontFamily: fonts.bold,
      lineHeight: 19,
    },
    discountLine3: {
      color: '#fff',
      fontSize: 9,
      fontFamily: fonts.semiBold,
      lineHeight: 12,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
      // marginTop: spacing.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    dotActive: {
      width: 18,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
  });
}
