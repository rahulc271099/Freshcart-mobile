import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
}

/**
 * Generic icon + title + body block for "nothing to show here" states (no
 * results, no data yet, ...). Feature-specific empty states with their own
 * fixed copy/icon - e.g. `CartEmptyState` - stay in their own feature
 * folder rather than being folded into this one; this is for the more
 * generic, reusable case (a product grid with no items, a list with no
 * matches, ...).
 */
export function EmptyState({ icon: Icon, title, body }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon color={colors.textSecondary} size={32} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSec,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    body: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });
}
