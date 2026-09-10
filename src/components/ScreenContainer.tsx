import React, { type PropsWithChildren, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing, useTheme } from '@/theme';

export interface ScreenContainerProps extends PropsWithChildren {
  /** Safe-area edges to apply. Defaults to all edges. */
  edges?: readonly Edge[];
  /** Wraps content in a ScrollView - use for forms/content taller than the viewport. Defaults to false. */
  scrollable?: boolean;
  /** Wraps content in a KeyboardAvoidingView - important for screens with inputs near the bottom
   * (e.g. auth forms with a CTA above the keyboard). Defaults to true. */
  keyboardAvoiding?: boolean;
  /** Applies the default horizontal screen padding. Defaults to true. */
  padded?: boolean;
  /** Defaults to the active theme's background color. */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom', 'left', 'right'];

/**
 * Reusable screen wrapper providing consistent safe-area handling, screen
 * padding and keyboard-avoidance. No feature/business logic lives here -
 * screens compose their own content as `children`.
 */
export function ScreenContainer({
  children,
  edges = DEFAULT_EDGES,
  scrollable = false,
  keyboardAvoiding = true,
  padded = true,
  backgroundColor,
  style,
  contentContainerStyle,
  testID,
}: ScreenContainerProps) {
  const { colors } = useTheme();
  // Same reasoning as Loader's `color` prop - resolved here rather than as
  // a destructure default, so the fallback follows the active theme.
  const resolvedBackgroundColor = backgroundColor ?? colors.background;

  const content: ReactNode = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        padded && styles.padded,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: resolvedBackgroundColor }, style]}
      testID={testID}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
});
