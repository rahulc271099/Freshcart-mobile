import React, { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface ProfileSectionCardProps {
  children: ReactNode;
}

/** Bordered/rounded container that groups a set of `ProfileMenuRow`s under
 * one card, with a hairline divider inserted between each row - falsy
 * children (e.g. a conditionally-rendered row) are filtered out first so a
 * hidden row doesn't leave a stray divider behind. */
export function ProfileSectionCard({ children }: ProfileSectionCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.card}>
      {items.map((child, index) => (
        <React.Fragment key={index}>
          {child}
          {index < items.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      marginHorizontal: spacing.md,
      overflow: 'hidden',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginLeft: spacing.md + 34 + spacing.sm,
    },
  });
}
