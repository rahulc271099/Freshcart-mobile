import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { images } from '@/constants/images';
import { authPalette } from '../authPalette';

export type AuthHeroVariant = 'onboarding' | 'login' | 'otp';

interface ScrimStop {
  offset: number;
  color: string;
  opacity: number;
}

/**
 * Vertical scrims tuned per screen. Every variant guarantees the text that
 * sits on the photo stays >= 4.5:1 against the *darkest plausible* pixel
 * behind it - the Stitch mock leaves white captions on bright tomatoes.
 */
const SCRIMS: Record<AuthHeroVariant, readonly ScrimStop[]> = {
  onboarding: [
    { offset: 0, color: '#050B1C', opacity: 0.45 },
    { offset: 0.2, color: '#050B1C', opacity: 0.04 },
    { offset: 0.45, color: '#050B1C', opacity: 0.18 },
    { offset: 0.65, color: '#050B1C', opacity: 0.8 },
    { offset: 1, color: '#050B1C', opacity: 0.96 },
  ],
  login: [
    { offset: 0, color: '#050B1C', opacity: 0.42 },
    { offset: 0.22, color: '#050B1C', opacity: 0.08 },
    { offset: 0.58, color: '#050B1C', opacity: 0 },
    { offset: 0.8, color: '#050B1C', opacity: 0.28 },
    { offset: 1, color: '#050B1C', opacity: 0.62 },
  ],
  otp: [
    { offset: 0, color: '#FFFFFF', opacity: 0.9 },
    { offset: 0.2, color: '#FFFFFF', opacity: 0.55 },
    { offset: 0.42, color: '#FFFFFF', opacity: 0 },
    { offset: 0.7, color: '#050B1C', opacity: 0.08 },
    { offset: 1, color: '#050B1C', opacity: 0.4 },
  ],
};

/** OTP's top is a light veil, so its status-bar glyphs must be dark. */
const STATUS_BAR_STYLE = {
  onboarding: 'light-content',
  login: 'light-content',
  otp: 'dark-content',
} as const;

/** Photo starts slightly zoomed and settles - a one-shot reveal, never a loop. */
const REVEAL_FROM_SCALE = 1.07;
const REVEAL_DURATION_MS = 1100;

export interface AuthHeroBackgroundProps {
  variant: AuthHeroVariant;
  /** Height of the photo area. Defaults to filling its parent. */
  height?: DimensionValue;
}

/**
 * Full-bleed produce photo + legibility scrim shared by Onboarding, Login
 * and OTP. Absolutely positioned and non-interactive: render it as the first
 * child of a screen root and lay content over it.
 *
 * Also owns the transparent status bar for these screens (the native
 * StatusBar stack restores the app's own bar when the screen unmounts).
 */
export function AuthHeroBackground({
  variant,
  height = '100%',
}: AuthHeroBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : REVEAL_FROM_SCALE);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withTiming(1, {
      duration: REVEAL_DURATION_MS,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
    });
  }, [reducedMotion, scale]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gradientId = `auth-scrim-${variant}`;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { height }]}
    >
      <StatusBar
        barStyle={STATUS_BAR_STYLE[variant]}
        translucent
        backgroundColor="transparent"
      />
      <Animated.Image
        source={images.authHero}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={[StyleSheet.absoluteFill, imageStyle]}
      />
      <Svg
        width="100%"
        height={typeof height === 'number' ? height : '100%'}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {SCRIMS[variant].map(stop => (
              <Stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height={typeof height === 'number' ? height : '100%'}
          fill={`url(#${gradientId})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    backgroundColor: authPalette.night,
  },
});
