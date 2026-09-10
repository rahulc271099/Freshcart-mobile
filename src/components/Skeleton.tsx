import React, { useEffect, useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { radius, useTheme, type ThemeColors } from '@/theme';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Minimal loading placeholder: a rounded box that gently pulses opacity
 * (not a moving shimmer gradient - simpler, cheaper, and avoids the
 * "constant background movement" pattern this app's animation spec
 * explicitly steers away from). Used for product images/cards while their
 * real content loads - see ProductCardSkeleton.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius: radiusOverride,
  style,
  testID,
}: SkeletonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.5, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      testID={testID}
      style={[
        styles.base,
        { width, height, borderRadius: radiusOverride ?? radius.sm },
        animatedStyle,
        style,
      ]}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      backgroundColor: colors.backgroundSec,
    },
  });
}
