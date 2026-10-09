import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  fonts,
  radius,
  spacing,
  typography,
  useTheme,
  type ThemeColors,
} from '@/theme';

interface HomeSectionErrorProps {
  title: string;
  onRetry: () => void;
}

/**
 * Compact inline failure state for one Home product section - keeps the
 * section's title in place (so the page doesn't reflow oddly) with a
 * one-line message and a retry, instead of a full-screen error for what's
 * only one of several independent sections.
 */
export function HomeSectionError({ title, onRetry }: HomeSectionErrorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.box}>
        <Text style={styles.message}>Couldn't load this right now.</Text>
        <Pressable
          onPress={onRetry}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Retry loading ${title}`}
        >
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
    },
    title: {
      ...typography.heading3,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    message: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    retry: {
      fontSize: 13,
      fontFamily: fonts.bold,
      color: colors.primary,
    },
  });
}
