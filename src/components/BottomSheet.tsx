import React, {
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  GestureHandlerRootView,
  ScrollView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { icons } from '@/constants/icons';
import {
  dimensions,
  fonts,
  radius,
  shadows,
  spacing,
  useTheme,
  type ThemeColors,
} from '@/theme';

export interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Sticky, non-scrolling content pinned below the (scrollable) body -
   * e.g. a "Total + Add to Cart" bar. Gets its own safe-area bottom
   * padding, same as the app's other bottom-anchored bars (CartBar,
   * CartScreen's checkout footer). */
  footer?: ReactNode;
  testID?: string;
}

const ANIMATION_MS = 220;

/**
 * Generic, reusable slide-up sheet - this file was an empty placeholder
 * before (same as `Modal.tsx` still is); this is the first real
 * implementation. A plain RN `Modal` (transparent, `animationType="none"`)
 * hosts the actual slide/fade, driven by Reanimated, so opening/closing
 * both animate properly - RN's own Modal has no exit animation once
 * `visible` flips to false, so this keeps the Modal mounted (`mounted`
 * state) for the duration of the closing animation and only unmounts it
 * once that finishes.
 *
 * Deliberately has no built-in drag-to-dismiss gesture - every current
 * caller closes it via an explicit action (a row's own button, the footer
 * button, the X, or the backdrop), so that complexity isn't earned yet.
 * Add it here (not per-caller) if/when a screen actually needs it.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  footer,
  children,
  testID,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(dimensions.screenHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: ANIMATION_MS });
      backdropOpacity.value = withTiming(1, { duration: ANIMATION_MS });
    } else if (mounted) {
      translateY.value = withTiming(
        dimensions.screenHeight,
        { duration: ANIMATION_MS },
        finished => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_MS });
    }
    // `mounted` is intentionally excluded - this effect should only react
    // to `visible` changing, not to its own `setMounted(false)` call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      {/* RN's `Modal` renders into its own separate native view hierarchy
          (a new UIViewController on iOS / Dialog on Android) - it is NOT
          part of the tree `GestureHandlerRootView` wraps at the app root
          (see AppProvider.tsx). Any gesture-handler gesture used inside a
          Modal (e.g. QuantitySlider's drag) silently doesn't work without
          its own root here - this is that root, scoped to just the
          Modal's content. */}
      <GestureHandlerRootView style={styles.gestureRoot}>
        <Animated.View
          style={[styles.backdrop, backdropAnimatedStyle]}
          onTouchEnd={onClose}
        />

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.sm },
            sheetAnimatedStyle,
          ]}
        >
          <View style={styles.handle} />

          {title ? (
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <icons.close
                  color={colors.textPrimary}
                  size={22}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    gestureRoot: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.overlay,
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: dimensions.screenHeight * 0.85,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xlg,
      borderTopRightRadius: radius.xlg,
      ...shadows.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      marginTop: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      marginRight: spacing.sm,
    },
    body: {
      flexShrink: 1,
    },
    bodyContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
  });
}
