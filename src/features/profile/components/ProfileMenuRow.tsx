import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { icons } from '@/constants/icons';
import { fonts, radius, spacing, useTheme, type ThemeColors } from '@/theme';

interface ProfileMenuRowProps {
  icon: keyof typeof icons;
  label: string;
  /** Optional second line under the label (e.g. "Track, return or buy
   * again") - omit for a single-line row. */
  subtitle?: string;
  onPress: () => void;
  /** Tint for the icon's circular background. Defaults to
   * `colors.backgroundSec` when not given (e.g. rows not yet assigned a
   * category color). */
  iconBackgroundColor?: string;
  /** Icon glyph color. Defaults to `colors.primary` when not given. */
  iconColor?: string;
  /** Small red dot for things that need attention - unused today, kept
   * available for e.g. "1 address missing a pincode" style nudges later. */
  showDot?: boolean;
  testID?: string;
}

export function ProfileMenuRow({
  icon,
  label,
  subtitle,
  onPress,
  iconBackgroundColor,
  iconColor,
  showDot = false,
  testID,
}: ProfileMenuRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const Icon = icons[icon];

  return (
    <Pressable style={styles.row} onPress={onPress} testID={testID}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: iconBackgroundColor ?? colors.backgroundSec },
        ]}
      >
        <Icon color={iconColor ?? colors.primary} size={18} strokeWidth={2} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showDot && <View style={styles.dot} />}
      <icons.chevronRight
        color={colors.textSecondary}
        size={18}
        strokeWidth={2}
      />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontFamily: fonts.medium,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.error,
      marginRight: spacing.xs,
    },
  });
}
