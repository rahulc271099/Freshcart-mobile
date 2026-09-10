import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

export type LoaderSize = 'small' | 'large';

export interface LoaderProps {
  /** Indicator size. Defaults to 'small' so it fits naturally inline (e.g. inside a Button). */
  size?: LoaderSize;
  /** Indicator color. Defaults to the active theme's primary brand color. */
  color?: ColorValue;
  /** Centers the loader within all available space - use for full-screen/section loading states. */
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Reusable loading indicator built on React Native's native ActivityIndicator.
 * Used standalone (full-screen/section loading states) and embedded inside
 * other components such as `Button`. Carries no feature logic.
 */
export function Loader({
  size = 'small',
  color,
  fullscreen = false,
  style,
  testID,
}: LoaderProps) {
  const { colors } = useTheme();
  // `color` can't default to `colors.primary` in the destructure above -
  // that would be evaluated once and never see later theme changes since
  // default params aren't re-evaluated by the hook. Resolving it here
  // means an explicit `color` prop still wins, but the fallback tracks
  // the active theme.
  const resolvedColor = color ?? colors.primary;

  if (!fullscreen) {
    return (
      <ActivityIndicator
        size={size}
        color={resolvedColor}
        style={style}
        testID={testID}
      />
    );
  }

  return (
    <View style={[styles.fullscreen, style]} testID={testID}>
      <ActivityIndicator size={size} color={resolvedColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
