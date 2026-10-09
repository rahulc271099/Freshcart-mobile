import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ScreenContainer } from '@/components';
import { icons } from '@/constants/icons';
import { AuthEntrance } from '@/features/auth/components/AuthEntrance';
import { AuthHeroBackground } from '@/features/auth/components/AuthHeroBackground';
import { BrandTile } from '@/features/auth/components/BrandTile';
import { GlassPill } from '@/features/auth/components/GlassPill';
import { PageDots } from '@/features/auth/components/PageDots';
import { authPalette } from '@/features/auth/authPalette';
import { fonts, spacing, useTheme } from '@/theme';
import type { AuthStackParamList } from '@/app/navigation/navigationTypes';

type OnboardingNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Onboarding'
>;

interface OnboardingSlide {
  id: string;
  /** Explicit line breaks keep the headline's rhythm identical to the design. */
  headline: string;
  /** Final word, tinted. */
  accent: string;
  body: string;
}

/**
 * Only the designed slide exists today. `PageDots` hides itself for a single
 * slide; add more entries (plus a pager) and the dots appear automatically.
 */
const SLIDES: readonly OnboardingSlide[] = [
  {
    id: 'harvest',
    headline: 'Fresh Farm Harvest,\nDelivered to Your',
    accent: 'Table',
    body: 'Handpicked organic fruits, crisp greens & heirloom vegetables harvested at dawn and brought directly to your home.',
  },
];

export const Onboarding1 = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [slideIndex] = useState(0);
  const slide = SLIDES[slideIndex];

  const gutter = width < 360 ? spacing.md : spacing.lg;
  const compact = height < 700;
  // Scales with the screen so "Fresh Farm Harvest," always fits one line.
  const headlineSize = Math.round(Math.min(38, Math.max(28, width * 0.085)));

  const styles = useMemo(
    () => createStyles(headlineSize, compact),
    [headlineSize, compact],
  );

  const goToLogin = useCallback(
    () => navigation.navigate('Login'),
    [navigation],
  );

  return (
    <View style={styles.root} testID="onboarding-screen">
      <AuthHeroBackground variant="onboarding" />
      <ScreenContainer
        scrollable
        padded={false}
        edges={[]}
        keyboardAvoiding={false}
        backgroundColor="transparent"
        scrollViewProps={{ bounces: false, overScrollMode: 'never' }}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + spacing.sm,
              paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
              paddingHorizontal: gutter,
            },
          ]}
        >
          <AuthEntrance style={styles.topRow}>
            <GlassPill tone="dark" style={styles.topPill}>
              <BrandTile size={22} style={styles.noShadow} />
              <Text style={styles.topPillText} maxFontSizeMultiplier={1.2}>
                FRESH & NATURAL <Text style={styles.topPillDot}>·</Text> FARM TO
                TABLE
              </Text>
            </GlassPill>
          </AuthEntrance>

          <View style={styles.spacer} />

          <AuthEntrance delay={90}>
            <Text accessibilityRole="header" style={styles.title}>
              {slide.headline}
              {'\n'}
              <Text style={styles.titleAccent}>{slide.accent}</Text>
            </Text>
            <Text style={styles.body}>{slide.body}</Text>
          </AuthEntrance>

          <AuthEntrance delay={170} style={styles.actions}>
            <PageDots count={SLIDES.length} index={slideIndex} />
            <Button
              title="Get Started"
              onPress={goToLogin}
              fullWidth
              pill
              rightIcon={
                <icons.arrowRight size={18} color={colors.textInverse} />
              }
              style={styles.cta}
              testID="onboarding-get-started"
            />
          </AuthEntrance>
        </View>
      </ScreenContainer>
    </View>
  );
};

function createStyles(headlineSize: number, compact: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: authPalette.night },
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
    },
    topRow: { alignSelf: 'stretch' },
    topPill: {
      alignSelf: 'stretch',
      justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 14,
      gap: 8,
    },
    noShadow: { shadowOpacity: 0 },
    topPillText: {
      fontFamily: fonts.bold,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 1.8,
      color: authPalette.white,
    },
    topPillDot: { color: authPalette.accentSoft },
    spacer: { flex: 1, minHeight: compact ? spacing.lg : spacing.xxl },
    title: {
      fontFamily: fonts.bold,
      fontSize: headlineSize,
      lineHeight: Math.round(headlineSize * 1.2),
      letterSpacing: -0.6,
      color: authPalette.white,
    },
    titleAccent: { color: authPalette.accentSoft },
    body: {
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 23,
      color: authPalette.onPhotoMuted,
      marginTop: spacing.md - 2,
      maxWidth: 420,
    },
    actions: { marginTop: spacing.lg - 4, gap: spacing.md },
    cta: {
      shadowColor: authPalette.brightBlue,
      shadowOpacity: 0.45,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
  });
}
