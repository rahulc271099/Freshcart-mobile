import React, { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cubicBezier,
  useReducedMotion,
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
  loadingTitle?: string;
  accessiblePrimary?: boolean;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  /** Stretches the button to fill its parent's width. Defaults to false. */
  fullWidth?: boolean;
  /** Trailing icon shown beside the title (hidden while loading). */
  rightIcon?: ReactNode;
  /** Fully rounded (capsule) corners instead of the default radius. */
  pill?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Subtle "squash" press feedback - matches the app's animation language
// (see project animation guidance: easing + timing, not an abrupt state change).
const PRESS_SCALE = 0.97;
const PRESS_DURATION_MS = 120;

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
  loadingTitle,
  accessiblePrimary = false,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  rightIcon,
  pill = false,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const isInteractive = !disabled && !loading;

  const variantStyles = useMemo(() => createVariantStyles(colors), [colors]);
  const variantStyle = variantStyles[variant];

  const pressStyle = {
    transform: [
      { scale: pressed && isInteractive && !reducedMotion ? PRESS_SCALE : 1 },
    ],
    transitionProperty: 'transform' as const,
    transitionDuration: reducedMotion ? 0 : PRESS_DURATION_MS,
    transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  };

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
    <Animated.View style={[fullWidth && styles.fullWidth, style, pressStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        pressRetentionOffset={16}
        disabled={!isInteractive}
        accessibilityRole="button"
        accessibilityLabel={loading ? loadingTitle ?? title : title}
        accessibilityState={{ disabled: !isInteractive, busy: loading }}
        testID={testID}
        style={[
          styles.base,
          variantStyle.container,
          fullWidth && styles.fullWidth,
          pill && styles.pill,
          accessiblePrimary && { backgroundColor: colors.primaryDark },
          !isInteractive && !(accessiblePrimary && loading) && styles.disabled,
        ]}
      >
        {loading && loadingTitle ? (
          <View style={styles.loadingContent}>
            <Loader size="small" color={variantStyle.loaderColor} />
            <Text style={[styles.text, variantStyle.text]}>{loadingTitle}</Text>
          </View>
        ) : loading ? (
          <Loader size="small" color={variantStyle.loaderColor} />
        ) : (
          <>
            <Text
              style={[styles.text, variantStyle.text]}
              numberOfLines={accessiblePrimary ? undefined : 1}
            >
              {title}
            </Text>
            {rightIcon ? (
              <View style={styles.rightIcon}>{rightIcon}</View>
            ) : null}
          </>
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
    paddingVertical: spacing.sm,
    flexDirection: 'row',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  pill: {
    borderRadius: radius.full,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
});
