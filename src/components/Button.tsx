import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  radius,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';
import { Loader } from './Loader';

export type ButtonVariant = 'primary' | 'secondary' | 'outline';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  /** Stretches the button to fill its parent's width. Defaults to false. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Subtle "squash" press feedback - matches the app's animation language
// (see project animation guidance: easing + timing, not an abrupt state change).
const PRESS_SCALE = 0.97;
const PRESS_DURATION_MS = 100;

type VariantStyles = Record<
  ButtonVariant,
  { container: ViewStyle; text: TextStyle; loaderColor: string }
>;

// Depends on `colors`, so it's built per-render (memoized on the resolved
// palette) rather than once at module scope - that's what makes the
// button's variants actually repaint when the theme changes.
function createVariantStyles(colors: ThemeColors): VariantStyles {
  return {
    primary: {
      container: { backgroundColor: colors.primary },
      text: { color: colors.textInverse },
      loaderColor: colors.textInverse,
    },
    secondary: {
      container: { backgroundColor: colors.secondary },
      text: { color: colors.textInverse },
      loaderColor: colors.textInverse,
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      },
      text: { color: colors.textPrimary },
      loaderColor: colors.primary,
    },
  };
}

/**
 * Generic, themeable call-to-action button. Contains no auth/API/navigation
 * logic - screens own what `onPress` actually does. Loading and disabled
 * states both suppress presses so a slow network can't produce duplicate
 * submissions.
 */
export function Button({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const isInteractive = !disabled && !loading;

  const variantStyles = useMemo(() => createVariantStyles(colors), [colors]);
  const variantStyle = variantStyles[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!isInteractive) return;
    scale.value = withTiming(PRESS_SCALE, {
      duration: PRESS_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [isInteractive, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: PRESS_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!isInteractive) return;
    onPress();
  }, [isInteractive, onPress]);

  return (
    // `style` is applied to this outer wrapper (not the inner Pressable)
    // since this is the box that actually participates in the parent's
    // layout - e.g. `style={{ flex: 1 }}` for two Buttons split evenly in a
    // row (see LoginScreen's social sign-in buttons). Keeping it off the
    // Pressable means external style can't accidentally clobber the
    // variant's own look.
    <Animated.View
      style={[fullWidth && styles.fullWidth, style, animatedStyle]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isInteractive}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        testID={testID}
        style={[
          styles.base,
          variantStyle.container,
          fullWidth && styles.fullWidth,
          !isInteractive && styles.disabled,
        ]}
      >
        {loading ? (
          <Loader size="small" color={variantStyle.loaderColor} />
        ) : (
          <Text style={[styles.text, variantStyle.text]} numberOfLines={1}>
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Layout-only - no color values, so this can stay a plain static
// StyleSheet shared across renders/themes.
const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
  },
});
